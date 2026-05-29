import { useState, useEffect } from 'react';
import { supabase, MALL_ID } from '../lib/supabase';

interface Mall {
  name: string;
  logo_url: string | null;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function StandbyScreen({ visible, onDismiss }: Props) {
  const [mall, setMall] = useState<Mall | null>(null);

  useEffect(() => {
    supabase
      .from('malls')
      .select('name, logo_url')
      .eq('id', MALL_ID)
      .single()
      .then(({ data }) => { if (data) setMall(data); });
  }, []);

  return (
    <div
      className={`standby-screen ${visible ? 'standby-visible' : 'standby-hidden'}`}
      onPointerDown={visible ? onDismiss : undefined}
    >
      <div className="standby-orb standby-orb-1" />
      <div className="standby-orb standby-orb-2" />

      <div className="standby-content">
        {mall?.logo_url && (
          <img
            src={mall.logo_url}
            alt={mall.name}
            className="standby-logo"
          />
        )}

        <p className="standby-eyebrow">Centro de Información</p>

        <h1 className="standby-title">
          Bienvenidos{mall?.name ? ` a` : ''}
        </h1>
        {mall?.name && (
          <h2 className="standby-mall-name glow-primary">{mall.name}</h2>
        )}

        <div className="standby-cta">
          <span>Toca la pantalla para comenzar</span>
        </div>
      </div>

      <div className="standby-powered">
        powered by <span className="standby-kiki glow-primary">kiki</span>
      </div>
    </div>
  );
}
