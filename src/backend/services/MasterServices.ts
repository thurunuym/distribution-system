import { db } from '../data/AppDbContext.ts';

export class ShopService {
  static getShops(routeId?: number) {
    let query = 'SELECT s.*, r.name as route_name FROM shops s JOIN routes r ON s.route_id = r.id';
    const params: any[] = [];

    if (routeId) {
      query += ' WHERE s.route_id = ?';
      params.push(routeId);
    }

    return db.prepare(query).all(...params);
  }

  static createShop(data: { name: string, address?: string, routeId: number }) {
    const result = db.prepare('INSERT INTO shops (name, address, route_id) VALUES (?, ?, ?)')
      .run(data.name, data.address || null, data.routeId);
    return db.prepare('SELECT * FROM shops WHERE id = ?').get(result.lastInsertRowid);
  }

  static updateShop(id: number, data: { name?: string, address?: string, routeId?: number }) {
    const sets: string[] = [];
    const params: any[] = [];

    if (data.name) { sets.push('name = ?'); params.push(data.name); }
    if (data.address !== undefined) { sets.push('address = ?'); params.push(data.address); }
    if (data.routeId) { sets.push('route_id = ?'); params.push(data.routeId); }

    if (sets.length === 0) return;
    params.push(id);
    db.prepare(`UPDATE shops SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }
}

export class RouteService {
  static getRoutes() {
    return db.prepare('SELECT * FROM routes').all();
  }

  static createRoute(name: string) {
    const result = db.prepare('INSERT INTO routes (name) VALUES (?)').run(name);
    return db.prepare('SELECT * FROM routes WHERE id = ?').get(result.lastInsertRowid);
  }
}

export class DashboardService {
  static getDailySummary(date: string) {
    const totalInvoiced = db.prepare('SELECT SUM(total_amount) as total FROM invoices WHERE date = ?').get(date) as any;
    const cashCollected = db.prepare(`
      SELECT SUM(amount) as total FROM payments
      WHERE date = ? AND type = 'cash'
    `).get(date) as any;
    const chequeAmount = db.prepare(`
      SELECT SUM(amount) as total FROM payments
      WHERE date = ? AND type = 'cheque'
    `).get(date) as any;
    const creditAmount = db.prepare(`
      SELECT SUM(total_amount - paid) as total FROM invoices
      WHERE date = ?
    `).get(date) as any;
    const chequesPending = db.prepare("SELECT COUNT(*) as count FROM cheques WHERE status = 'pending'").get() as any;
    const totalOutstandingCredit = db.prepare("SELECT SUM(total_amount - paid) as total FROM invoices WHERE status = 'credit'").get() as any;

    const totalAmount = totalInvoiced?.total || 0;
    const chequeCount = db.prepare(`
      SELECT COUNT(*) as count FROM payments 
      WHERE date = ? AND type = 'cheque'
    `).get(date) as any;

    return {
      totalInvoices: (db.prepare('SELECT COUNT(*) as count FROM invoices WHERE date = ?').get(date) as any).count,
      totalAmount,
      cashCollected: cashCollected?.total || 0,
      chequeAmount: chequeAmount?.total || 0,
      chequeCount: chequeCount?.count || 0,
      creditAmount: creditAmount?.total || 0,
      totalOutstandingCredit: totalOutstandingCredit?.total || 0,
      chequesPending: chequesPending?.count || 0
    };
  }

  static getChequesDueToday(date: string) {
    return db.prepare(`
      SELECT c.*, i.number as invoice_number, s.name as shop_name
      FROM cheques c
      JOIN invoices i ON c.invoice_id = i.id
      JOIN shops s ON i.shop_id = s.id
      WHERE c.due_date = ?
    `).all(date);
  }
}
