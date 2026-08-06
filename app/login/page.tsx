"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BackgroundSlideshow } from "@/components/BackgroundSlideshow";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ApiErru, mensajenErru } from "@/lib/api";
import { login, useSesaun } from "@/lib/auth";

import { TailSpin } from 'react-loader-spinner'
import { cx } from "@/lib/cx";

export default function LoginPage() {
  const router = useRouter();
  const sesaun = useSesaun();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erru, setErru] = useState<string | null>(null);
  const [haruka, setHaruka] = useState(false);

  // Someone who is already signed in has no business on this screen.
  useEffect(() => {
    if (sesaun) router.replace("/");
  }, [sesaun, router]);

  async function tama(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErru("Favor prenxe email no password.");
      return;
    }

    setHaruka(true);
    try {
      const perfil = await login(email.trim(), password);
      // Every screen behind the login calls an admin-only route; an account
      // without EhAdmin would sign in and then hit 403 everywhere.
      if (perfil.role !== "ADMIN") {
        setErru("Konta ne'e la iha asesu ba painel administrasaun.");
        setHaruka(false);
        return;
      }
      router.replace("/");
    } catch (e) {
      setErru(
        e instanceof ApiErru && e.status === 401
          ? "Email ka password sala. Favor koko fila fali."
          : mensajenErru(e),
      );
      setHaruka(false);
    }
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
          <Field label="Email" htmlFor="lEmail">
            <input
              id="lEmail"
              type="email"
              value={email}
              autoComplete="username"
              autoFocus
              onChange={(e) => {
                setEmail(e.target.value);
                setErru(null);
              }}
              placeholder="naran@eti.tl"
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
              placeholder="••••••••"
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

          <Button type="submit" disabled={haruka} className={cx(haruka && "opacity-75", "mt-1 justify-center")}>
            {haruka && (
              <TailSpin
                visible={true}
                height="80"
                width="80"
                color="#fefefe"
                ariaLabel="tail-spin-loading"
                radius="1"
                wrapperStyle={{}}
                wrapperClass=""
              />)
            }
            Tama
          </Button>
        </form>

        <div className="mt-5 rounded-[8px] border border-dashed border-border bg-bg px-[11px] py-[9px] text-center text-[12px] text-muted">
          Uza konta ETI-Dili ho asesu <b className="text-text">ADMIN</b>.
        </div>
      </div>
    </div>
  );
}
