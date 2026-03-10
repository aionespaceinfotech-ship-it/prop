import { formatCurrency } from '../utils/formatters';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  area: number;
  type: string;
  facing?: string | null;
  road_width_ft?: number | null;
}

interface Lead {
  client_name: string;
  client_phone: string;
}

export function useWhatsAppShare() {
  const shareProperty = (property: Property) => {
    const roadText = property.road_width_ft ? `${property.road_width_ft} ft` : 'N/A';
    const text = `🏠 *${property.title}*\n📍 Location: ${property.location}\n💰 Price: ${formatCurrency(property.price)}\n📐 Area: ${property.area} sqft\n🧭 Facing: ${property.facing || 'N/A'}\n🛣️ Road: ${roadText}\n\nView details: ${window.location.origin}/catalog?id=${property.id}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareLeadMatches = (lead: Lead, properties: Property[]) => {
    const lines = [
      `Hello *${lead.client_name}*,`,
      '',
      'As per your requirement, here are some matching properties:',
      '',
    ];

    properties.slice(0, 5).forEach((p, idx) => {
      lines.push(`${idx + 1}. *${p.title}*`);
      lines.push(`   📍 ${p.location}`);
      lines.push(`   💰 ${formatCurrency(p.price)}`);
      lines.push(`   🔗 ${window.location.origin}/catalog?id=${p.id}`);
      lines.push('');
    });

    lines.push('Let me know if you would like to schedule a site visit.');

    const url = `https://wa.me/${lead.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  const shareGeneralText = (phone: string, text: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return {
    shareProperty,
    shareLeadMatches,
    shareGeneralText
  };
}
