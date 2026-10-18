import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { CreditCard, Download, Search, CheckCircle2, AlertCircle, FileText, ExternalLink } from 'lucide-react';

export const PaymentsInvoices = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/payments?status=${statusFilter}`);
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (e) {
      console.warn('Error fetching payments:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Payments & GST Invoices</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Verified practice receipts and automated computer-generated PDF invoices.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <option value="all">All Transactions</option>
          <option value="captured">Captured (Successful)</option>
          <option value="created">Pending Payment</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} className="h-14 w-full" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No transactions found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/60 text-text-muted uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Invoice #</th>
                  <th className="px-5 py-3.5 font-bold">Client</th>
                  <th className="px-5 py-3.5 font-bold">Service / Package</th>
                  <th className="px-5 py-3.5 font-bold">Amount</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-5 py-3.5 font-bold text-right">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-text">
                      {p.invoiceNumber}
                      {p.isSimulated && (
                        <span className="block text-[9px] font-sans font-normal text-warning">
                          [Test Simulator]
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-text">{p.clientId?.name || 'Client'}</div>
                      <div className="text-[11px] text-text-muted">{p.clientId?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-text font-medium">
                      {p.itemDescription}
                    </td>
                    <td className="px-5 py-4 font-bold text-text">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={p.status === 'captured' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-text-muted">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={`/api/payments/invoices/${p._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-primary text-xs font-semibold transition-colors shadow-subtle"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
