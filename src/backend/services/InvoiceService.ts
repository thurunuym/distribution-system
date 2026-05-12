import { db } from '../data/AppDbContext.ts';
import { CreateInvoiceRequest, Invoice } from '../models/entities.ts';

export class InvoiceService {
  static createInvoice(data: CreateInvoiceRequest): Invoice {
    const { number, shopId, date, totalAmount, remarks, payments, cheque } = data;

    // 1. Validate: sum(payments.amount) <= totalAmount
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid > totalAmount) {
      throw new Error(`Total payments (${totalPaid}) cannot exceed invoice amount (${totalAmount})`);
    }

    // 2. Begin transaction
    const transaction = db.transaction(() => {
      const status = totalPaid >= totalAmount ? 'settled' : 'credit';

      // 3. Insert invoice
      const invoiceResult = db.prepare(`
        INSERT INTO invoices (number, shop_id, date, total_amount, paid, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(number, shopId, date, totalAmount, totalPaid, status, remarks || null);

      const invoiceId = invoiceResult.lastInsertRowid as number;

      // 4. Handle Cheque if exists
      let chequeId: number | null = null;
      if (cheque) {
        const chequeResult = db.prepare(`
          INSERT INTO cheques (invoice_id, cheque_no, bank, amount, date_received, due_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(invoiceId, cheque.chequeNo, cheque.bank, cheque.amount, cheque.dateReceived, cheque.dueDate);
        chequeId = chequeResult.lastInsertRowid as number;
      }

      // 5. Insert payments
      const insertPayment = db.prepare(`
        INSERT INTO payments (invoice_id, amount, type, date, cheque_id)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const p of payments) {
        insertPayment.run(invoiceId, p.amount, p.type, date, p.type === 'cheque' ? chequeId : null);
      }

      // Return full invoice
      return db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as Invoice;
    });

    return transaction();
  }

  static getInvoiceById(id: number) {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as Invoice;
    if (!invoice) return null;

    const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ?').all(id);
    const cheques = db.prepare('SELECT * FROM cheques WHERE invoice_id = ?').all(id);

    return {
      ...invoice,
      due: invoice.total_amount - invoice.paid,
      payments,
      cheques
    };
  }

  static getInvoices(filters: { date?: string, shopId?: string, status?: string }) {
    let query = 'SELECT i.*, s.name as shop_name FROM invoices i JOIN shops s ON i.shop_id = s.id WHERE 1=1';
    const params: any[] = [];

    if (filters.date) {
      query += ' AND i.date = ?';
      params.push(filters.date);
    }
    if (filters.shopId) {
      query += ' AND i.shop_id = ?';
      params.push(parseInt(filters.shopId));
    }
    if (filters.status) {
      query += ' AND i.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY i.date DESC, i.id DESC';

    const invoices = db.prepare(query).all(...params) as any[];
    return invoices.map(i => ({
      ...i,
      due: i.total_amount - i.paid
    }));
  }

  static updateInvoice(id: number, data: { remarks?: string, status?: string }) {
    const sets: string[] = [];
    const params: any[] = [];

    if (data.remarks !== undefined) {
      sets.push('remarks = ?');
      params.push(data.remarks);
    }
    if (data.status !== undefined) {
      sets.push('status = ?');
      params.push(data.status);
    }

    if (sets.length === 0) return;

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  static getCredits(filters: { routeId?: string, agingMonths?: number, specificDate?: string }) {
    let query = `
      SELECT i.*, s.name as shop_name, r.name as route_name, r.id as route_id
      FROM invoices i 
      JOIN shops s ON i.shop_id = s.id 
      JOIN routes r ON s.route_id = r.id
      WHERE i.status = 'credit'
    `;
    const params: any[] = [];

    if (filters.routeId) {
      query += ' AND r.id = ?';
      params.push(parseInt(filters.routeId));
    }

    if (filters.specificDate) {
      query += ' AND i.date = ?';
      params.push(filters.specificDate);
    } else if (filters.agingMonths !== undefined) {
      const months = filters.agingMonths;
      if (months === 3) {
        query += " AND i.date <= date('now', '-3 months')";
      } else {
        query += ` AND i.date <= date('now', '-${months} months') AND i.date > date('now', '-${months + 1} months')`;
      }
    }

    query += ' ORDER BY i.date ASC';

    return db.prepare(query).all(...params).map((i: any) => ({
      ...i,
      due: i.total_amount - i.paid
    }));
  }
}
