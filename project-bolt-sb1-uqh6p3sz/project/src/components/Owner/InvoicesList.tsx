import { useEffect, useState } from 'react';
import { FileText, Eye, Download, Loader, Calendar } from 'lucide-react';
import { getInvoicesForOwner, type Invoice } from '../../services/invoiceService';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    const data = await getInvoicesForOwner();
    setInvoices(data);
    setLoading(false);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mes factures</h2>
        <p className="mt-1 text-sm text-gray-600">
          Consultez vos factures mensuelles et vos revenus locatifs
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-600">
            Vos factures mensuelles apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {invoice.invoice_number}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Période : {new Date(invoice.period_start).toLocaleDateString('fr-FR')}
                      {' - '}
                      {new Date(invoice.period_end).toLocaleDateString('fr-FR')}
                    </div>
                    {invoice.due_date && (
                      <div className="mt-1 text-xs text-gray-500">
                        Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {getStatusLabel(invoice.status)}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Revenu total</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Number(invoice.total_revenue).toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Commission</div>
                  <div className="text-lg font-semibold text-red-600">
                    -{Number(invoice.total_commission).toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Frais ménage</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Number(invoice.total_cleaning_fees).toFixed(2)} €
                  </div>
                </div>
                <div className="md:col-span-1 col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Net à percevoir</div>
                  <div className="text-xl font-bold text-green-600">
                    {Number(invoice.owner_net_amount).toFixed(2)} €
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-3">
                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Voir détail
                </button>
                {invoice.pdf_url && (
                  <button
                    onClick={() => invoice.pdf_url && window.open(invoice.pdf_url, '_blank')}
                    className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF
                  </button>
                )}
              </div>
            </div>
          ))}
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
