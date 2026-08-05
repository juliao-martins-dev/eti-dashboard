"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BackgroundSlideshow } from "@/components/BackgroundSlideshow";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { login, useSesaun } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const sesaun = useSesaun();
  const [naran, setNaran] = useState("");
  const [password, setPassword] = useState("");
  const [erru, setErru] = useState<string | null>(null);

  // Someone who is already signed in has no business on this screen.
  useEffect(() => {
    if (sesaun) router.replace("/");
  }, [sesaun, router]);

  function tama(e: FormEvent) {
    e.preventDefault();
    if (!naran.trim() || !password) {
      setErru("Favor prenxe naran uzuáriu no password.");
      return;
    }
    if (login(naran.trim(), password)) {
      router.replace("/");
      return;
    }
    setErru("Naran uzuáriu ka password sala. Favor koko fila fali.");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <BackgroundSlideshow />

      <div className="relative z-10 w-full max-w-[380px] rounded-card border border-border bg-surface p-7">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/icon.png"
            alt="Escola Técnica Informática Dili"
            width={72}
            height={72}
            priority
            className="h-[72px] w-[72px]"
          />
          <b className="mt-3 block font-brand text-[19px] tracking-[0.02em]">
            ETI PRESENSA
          </b>
          <span className="mt-[3px] flex items-center gap-[6px] text-[12px] text-muted">
            <i className="inline-block h-[7px] w-[7px] rounded-full bg-accent" />
            Painel Administrasaun
          </span>
        </div>

        <form onSubmit={tama} className="mt-6 flex flex-col gap-3">
          <Field label="Naran uzuáriu" htmlFor="lNaran">
            <input
              id="lNaran"
              value={naran}
              autoComplete="username"
              autoFocus
              onChange={(e) => {
                setNaran(e.target.value);
                setErru(null);
              }}
              placeholder="admin"
            />
          </Field>

          <Field label="Password" htmlFor="lPass">
            <input
              id="lPass"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setErru(null);
              }}
              placeholder="••••"
            />
          </Field>

          {erru ? (
            <p
              role="alert"
              className="rounded-[8px] border border-[color-mix(in_srgb,var(--color-bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-bad)_9%,transparent)] px-[11px] py-[9px] text-[12px] font-medium text-bad"
            >
              {erru}
            </p>
          ) : null}

          <Button type="submit" className="mt-1 justify-center">
            Tama
          </Button>
        </form>

        <div className="mt-5 rounded-[8px] border border-dashed border-border bg-bg px-[11px] py-[9px] text-center text-[12px] text-muted">
          Konta test: <b className="font-mono text-text">admin</b> /{" "}
          <b className="font-mono text-text">123</b>
        </div>
      </div>
    </div>
  );
}
