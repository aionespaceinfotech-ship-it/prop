import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';

const faqs = [
  { q: 'How do I assign leads to salespersons?', a: 'Open Leads and select the assigned user while creating or updating the lead.' },
  { q: 'Why can a salesperson see fewer leads?', a: 'Salespersons are restricted to leads assigned to them only.' },
  { q: 'How do I share matching properties?', a: 'Open lead details and click "Share Matching Properties", or use Property page bulk-share buttons.' },
];

export default function Support() {
  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-5xl">
      <PageHeader title="Support" subtitle="Help center for your property CRM operations." />
      <Card className="p-6 space-y-5 border-none shadow-sm ring-1 ring-slate-200">
        {faqs.map((item) => (
          <div key={item.q} className="pb-4 border-b border-slate-100 last:border-b-0">
            <p className="font-semibold text-slate-900">{item.q}</p>
            <p className="text-sm text-slate-600 mt-1">{item.a}</p>
          </div>
        ))}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-sm text-slate-500">Need direct help?</p>
          <Button onClick={() => window.open('https://wa.me/?text=Hi,%20I%20need%20help%20with%20PropBroker%20CRM', '_blank')}>
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  );
}
