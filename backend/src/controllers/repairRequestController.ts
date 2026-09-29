// ============================================================================
// Member 4 - Repair Request Controller (Phase 2, 3, 5)
// ============================================================================

import { Request, Response } from 'express';
import { repairRequestService } from '../services/repairRequestService';
import { validateCreateRepairRequest } from '../validators/repairRequestValidator';
import { AuthIntegrationAdapter } from '../adapters/mockIntegrationAdapters';

export class RepairRequestController {
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const customer = AuthIntegrationAdapter.getCurrentCustomer();
      const customerId = req.body.customerId || customer.id;

      const input = {
        ...req.body,
        customerId,
      };

      const validation = validateCreateRepairRequest(input);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: validation.errors.join(', '),
        });
        return;
      }

      const request = await repairRequestService.createRepairRequest(input);
      res.status(201).json({
        success: true,
        statusCode: 201,
        data: request,
        message: 'Repair request created successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not exist') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        statusCode,
        error: error.message || 'Failed to create repair request',
      });
    }
  }

  async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await repairRequestService.getRequestById(id);
      if (!request) {
        res.status(404).json({
          success: false,
          statusCode: 404,
          error: `Repair request '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: request,
        message: 'Repair request retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Failed to retrieve repair request',
      });
    }
  }

  async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, providerId } = req.query;
      let requests;

      if (typeof providerId === 'string') {
        requests = await repairRequestService.getRequestsByProvider(providerId);
      } else if (typeof customerId === 'string') {
        requests = await repairRequestService.getRequestsByCustomer(customerId);
      } else {
        requests = await repairRequestService.getAllRequests();
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: requests,
        message: 'Repair requests list retrieved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message || 'Failed to retrieve requests',
      });
    }
  }

  async respondToRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, estimatedPrice, providerNotes, rejectionReason } = req.body;

      const { validateProviderResponse } = await import('../validators/quotationValidator');
      const validation = validateProviderResponse({
        action,
        estimatedPrice,
        providerNotes,
        rejectionReason,
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          statusCode: 400,
          error: validation.errors.join(', '),
        });
        return;
      }

      const updated = await repairRequestService.respondToRequest(id, {
        action,
        estimatedPrice,
        providerNotes,
        rejectionReason,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: updated,
        message: `Repair request ${action === 'ACCEPT' ? 'accepted with quotation' : 'rejected'} successfully`,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        statusCode,
        error: error.message || 'Failed to respond to repair request',
      });
    }
  }
}

export const repairRequestController = new RepairRequestController();
