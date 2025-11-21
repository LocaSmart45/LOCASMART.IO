import { useEffect, useState } from 'react';
import { FileText, Plus, Eye, Check, Loader, Download, Calendar } from 'lucide-react';
import {
  getInvoicesForAdmin,
  generateMonthlyInvoices,
  updateInvoiceStatus,
  type Invoice
} from '../../services/invoiceService';

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    const data = await getInvoicesForAdmin();
    setInvoices(data);
    setLoading(false);
  }

  async function handleGenerateInvoices() {
    setGenerating(true);
    setMessage(null);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    const result = await generateMonthlyInvoices(periodStart, periodEnd);

    if (result.success) {
      const created = result.results?.filter(r => r.status === 'created').length || 0;
      const skipped = result.results?.filter(r => r.status === 'skipped').length || 0;
      setMessage({
        type: 'success',
        text: `${created} facture(s) créée(s), ${skipped} ignorée(s)`
      });
      await loadInvoices();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Erreur lors de la génération'
      });
    }

    setGenerating(false);
  }

  async function handleMarkAsPaid(invoiceId: string) {
    const result = await updateInvoiceStatus(invoiceId, 'paid');
    if (result.success) {
      setMessage({ type: 'success', text: 'Facture marquée comme payée' });
      await loadInvoices();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur' });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'sent':
        return 'Envoyée';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturation propriétaires</h2>
          <p className="mt-1 text-sm text-gray-600">
            Générez et gérez les factures mensuelles pour vos propriétaires
          </p>
        </div>
        <button
          onClick={handleGenerateInvoices}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? (
            <Loader className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Plus className="w-5 h-5 mr-2" />
          )}
          Générer mois dernier
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-600 mb-4">
            Cliquez sur "Générer mois dernier" pour créer les factures mensuelles
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  N° Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Période
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Revenu total
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Commission
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Net propriétaire
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {invoice.profiles?.first_name} {invoice.profiles?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{invoice.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(invoice.period_start).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {Number(invoice.total_revenue).toFixed(2)} €
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-blue-600">
                      {Number(invoice.total_commission).toFixed(2)} €
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(invoice.owner_net_amount).toFixed(2)} €
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Voir détail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Marquer comme payée"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {invoice.pdf_url && (
                        <button
                          onClick={() => window.open(invoice.pdf_url, '_blank')}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Facture {selectedInvoice.invoice_number}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="text-center py-12 text-gray-600">
                Détails de la facture - À implémenter avec le composant InvoiceDetail
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
