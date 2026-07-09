import PageHeading from "@/components/site/PageHeading";
import Reveal from "@/components/site/Reveal";
import type { Partner, PartnersJson } from "@/lib/types";

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="partner-card">
      {partner.logo ? (
        <img src={partner.logo} alt={partner.name} loading="lazy" />
      ) : (
        <span className="partner-card__name">{partner.name}</span>
      )}
    </div>
  );
}

interface PartnersViewProps {
  data: PartnersJson;
}

export default function PartnersView({ data }: PartnersViewProps) {
  return (
    <>
      <PageHeading title={data.title} />
      <Reveal className="section">
        <div className="partners-section">
          <p className="partners-section__label">Principais</p>
          <div className="partners-grid partners-grid--main">
            {(data.main || []).map((partner) => (
              <PartnerCard key={partner.name} partner={partner} />
            ))}
          </div>
        </div>
        <div className="partners-section">
          <p className="partners-section__label">Secundários</p>
          <div className="partners-grid partners-grid--secondary">
            {(data.secondary || []).map((partner) => (
              <PartnerCard key={partner.name} partner={partner} />
            ))}
          </div>
        </div>
      </Reveal>
    </>
  );
}
