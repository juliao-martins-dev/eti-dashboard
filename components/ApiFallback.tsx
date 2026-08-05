"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Hint } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  API_SEM_LIGASAUN,
  apiAlternativa,
  apiBase,
  setApiBase,
} from "@/lib/api";

/**
 * When a request cannot reach eti-api at all, offer the school's other LAN
 * address — but never swap silently. Pointing the dashboard at a different
 * server is the administrator's call, so the switch waits for a confirmation
 * and is then remembered until they change it again.
 */
export function ApiFallback() {
  const [alvo, setAlvo] = useState<string | null>(null);
  const [atual, setAtual] = useState("");

  useEffect(() => {
    const aviza = () => {
      const outru = apiAlternativa();
      if (!outru) return;
      // Keep the first offer on screen; a page mounts several requests at once
      // and every one of them fails on a dead network.
      setAlvo((abertu) => abertu ?? outru);
      setAtual(apiBase());
    };
    addEventListener(API_SEM_LIGASAUN, aviza);
    return () => removeEventListener(API_SEM_LIGASAUN, aviza);
  }, []);

  if (!alvo) return null;

  return (
    <Modal
      open
      onClose={() => setAlvo(null)}
      title="La bele konekta ba servidor"
      subtitle="Dashboard la konsege hetan eti-api iha enderesu ne'e"
      footer={
        <>
          <Button variant="ghost" onClick={() => setAlvo(null)}>
            Kansela
          </Button>
          <Button
            onClick={() => {
              setApiBase(alvo);
              // A reload is the honest way to redo every request the failed
              // host already answered with an error.
              location.reload();
            }}
          >
            Troka no koko fila fali
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1 text-[13px]">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Agora</span>
          <b className="font-mono text-[12px] text-bad">{atual}</b>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Troka ba</span>
          <b className="font-mono text-[12px]">{alvo}</b>
        </div>
      </div>
      <Hint>
        Servidor ETI iha enderesu rua, ida ba kada rede. Se dashboard muda rede,
        hili enderesu seluk. Eskolla ne&apos;e sei rai iha navegadór to&apos;o
        Ita troka fali iha Konfigurasaun.
      </Hint>
    </Modal>
  );
}
