import { db } from '../data/AppDbContext.ts';
import { Cheque } from '../models/entities.ts';

export class ChequeService {
  static getCheques(status?: string) {
    let query = `
      SELECT c.*, i.number as invoice_number, s.name as shop_name
      FROM cheques c
      JOIN invoices i ON c.invoice_id = i.id
      JOIN shops s ON i.shop_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.due_date ASC';

    return db.prepare(query).all(...params);
  }

  static updateChequeStatus(id: number, data: { status: string, returnReason?: string, clearedDate?: string }) {
    const transaction = db.transaction(() => {
      const cheque = db.prepare('SELECT * FROM cheques WHERE id = ?').get(id) as Cheque;
      if (!cheque) throw new Error('Cheque not found');

      // Update cheque
      db.prepare(`
        UPDATE cheques
        SET status = ?, return_reason = ?, cleared_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.status, data.returnReason || null, data.clearedDate || null, id);

      // If status is paid, we might want to check if the invoice is now settled?
      // Actually, in the spec, "Paid" is already recorded in the invoice total.
      // The cheque record status just tracks the physical cheque clearance.
      // But if it's returned, we should subtract from invoice paid?
      // Spec says: "Invoice: set paid = sum(payments.amount)" at create time.
      // If cheque returns, invoice should technically go back to credit?
      // Let's implement that logic if it's 'returned'.

      if (data.status === 'returned') {
        const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(cheque.invoice_id) as any;
        const newPaid = invoice.paid - cheque.amount;
        db.prepare(`
          UPDATE invoices
          SET paid = ?, status = 'credit', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newPaid, cheque.invoice_id);
      }
    });

    transaction();
  }
}
