import { Request, Response } from 'express';
import { RouteService, ShopService, DashboardService } from '../services/MasterServices.ts';
import { InvoiceService } from '../services/InvoiceService.ts';
import { ChequeService } from '../services/ChequeService.ts';

export const RoutesController = {
  /** List all routes */
  async getAll(req: Request, res: Response) {
    res.json(RouteService.getRoutes());
  },
  /** Create a route */
  async create(req: Request, res: Response) {
    res.status(201).json(RouteService.createRoute(req.body.name));
  }
};

export const ShopsController = {
  /** List all shops */
  async getAll(req: Request, res: Response) {
    const routeId = req.query.routeId ? parseInt(req.query.routeId as string) : undefined;
    res.json(ShopService.getShops(routeId));
  },
  /** Create a shop */
  async create(req: Request, res: Response) {
    res.status(201).json(ShopService.createShop(req.body));
  },
  /** Update a shop */
  async update(req: Request, res: Response) {
    ShopService.updateShop(parseInt(req.params.id), req.body);
    res.sendStatus(204);
  }
};

export const InvoicesController = {
  /** List invoices */
  async getAll(req: Request, res: Response) {
    res.json(InvoiceService.getInvoices(req.query));
  },
  /** Get single invoice */
  async getById(req: Request, res: Response) {
    const invoice = InvoiceService.getInvoiceById(parseInt(req.params.id));
    if (!invoice) return res.status(404).json({ title: 'Not Found', detail: 'Invoice not found' });
    res.json(invoice);
  },
  /** Create invoice atomically */
  async create(req: Request, res: Response) {
    try {
      const invoice = InvoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ title: 'Bad Request', detail: error.message });
    }
  },
  /** Update invoice status/remarks */
  async update(req: Request, res: Response) {
    InvoiceService.updateInvoice(parseInt(req.params.id), req.body);
    res.sendStatus(204);
  },
  /** Summary summary daily */
  async getSummary(req: Request, res: Response) {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json(DashboardService.getDailySummary(date));
  }
};

export const ChequesController = {
  /** List cheques */
  async getAll(req: Request, res: Response) {
    res.json(ChequeService.getCheques(req.query.status as string));
  },
  /** Update cheque status */
  async update(req: Request, res: Response) {
    try {
      ChequeService.updateChequeStatus(parseInt(req.params.id), req.body);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ title: 'Bad Request', detail: error.message });
    }
  }
};

export const DashboardController = {
  /** Get daily dashboard data */
  async getDaily(req: Request, res: Response) {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json(DashboardService.getDailySummary(date));
  }
};
