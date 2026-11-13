"use client";

import { useTransition } from "react";
import { ArrowRightToSquare, Wrench } from "@gravity-ui/icons";
import { Button, Card, Spinner } from "@heroui/react";

import { signInDev, signInWithDiscord } from "@/app/actions/auth";

export function DiscordLoginButton({ callbackUrl }: { callbackUrl?: string }) {
  const [pending, start] = useTransition();

  return (
    <Button fullWidth isPending={pending} size="lg" onPress={() => start(() => signInWithDiscord(callbackUrl))}>
      {pending ? <Spinner color="current" size="sm" /> : <ArrowRightToSquare />}
      Mit Discord anmelden
    </Button>
  );
}

export function DevLogin({ callbackUrl }: { callbackUrl?: string }) {
  const [pending, start] = useTransition();

  return (
    <Card variant="secondary">
      <Card.Header className="flex-row items-center gap-2">
        <Wrench className="size-4 text-muted" />
        <Card.Title>Testzugang (nur lokal)</Card.Title>
      </Card.Header>
      <Card.Footer className="gap-2">
        <Button isDisabled={pending} size="sm" variant="tertiary" onPress={() => start(() => signInDev("buerger", callbackUrl))}>
          Als Bürger
        </Button>
        <Button isDisabled={pending} size="sm" variant="tertiary" onPress={() => start(() => signInDev("admin", callbackUrl))}>
          Als Verwaltung
        </Button>
      </Card.Footer>
    </Card>
  );
}
