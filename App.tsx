import React, { useCallback, useEffect, useRef, useState } from 'react';
import AfterglowView from './components/AfterglowView';
import ComposeView, { type ComposePayload } from './components/ComposeView';
import LandingView from './components/LandingView';
import ReceiveView, { type ReceiveStatus } from './components/ReceiveView';
import RevealView from './components/RevealView';
import ShareReadyView, { type SealedWhisper } from './components/ShareReadyView';
import SnowflakeGalleryView from './components/SnowflakeGalleryView';
import { useI18n } from './contexts/I18nContext';
import { useSound } from './contexts/SoundContext';
import { verifyFragmentSecret } from './protocol/oneTimeWhisper';
import {
  consumeOneTimeWhisper,
  consumeTokenFromLocation,
  consistencyTokenFromLocation,
  createOneTimeWhisper,
  deleteOneTimeWhisper,
  fragmentSecretFromLocation,
  getWhisperStatus,
  OneTimeWhisperApiError,
  OneTimeWhisperConsumeUncertainError,
} from './utils/oneTimeWhisper';
import { createSnowflakeSignature } from './utils/signature';
import { collectKeepsake, hasKeepsake, type KeepsakeOrigin } from './utils/keepsakeGallery';
import type { SoundScene } from './utils/sound';

enum View {
  LANDING = 'landing',
  COMPOSE = 'compose',
  SHARE_READY = 'share-ready',
  RECEIVE = 'receive',
  REVEALED = 'revealed',
  GALLERY = 'gallery',
  AFTERGLOW = 'afterglow',
}

interface RecipientRoute {
  id: string;
  fragmentSecret: string | null;
  consumeToken: string | null;
  consistencyToken: string | null;
}

const WHISPER_ROUTE = /^\/s\/([A-Za-z0-9_-]{22})\/?$/u;

function recipientRouteFromLocation(): RecipientRoute | null {
  const match = window.location.pathname.match(WHISPER_ROUTE);
  if (!match) return null;
  return {
    id: match[1],
    fragmentSecret: fragmentSecretFromLocation(),
    consumeToken: consumeTokenFromLocation(),
    consistencyToken: consistencyTokenFromLocation(),
  };
}

const App: React.FC = () => {
  const [recipient, setRecipient] = useState<RecipientRoute | null>(() => recipientRouteFromLocation());
  const [currentView, setCurrentView] = useState<View>(() => recipient ? View.RECEIVE : View.LANDING);
  const [sealedWhisper, setSealedWhisper] = useState<SealedWhisper | null>(null);
  const [receiveStatus, setReceiveStatus] = useState<ReceiveStatus>(() => (
    recipient?.fragmentSecret && recipient.consumeToken ? 'loading' : 'invalid'
  ));
  const [receiveExpiresAt, setReceiveExpiresAt] = useState<number>();
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState(createSnowflakeSignature);
  const [afterglowReturn, setAfterglowReturn] = useState<View>(View.LANDING);
  const [, setCollectionRevision] = useState(0);
  const { setScene, play } = useSound();
  const { t, localeTag } = useI18n();
  const hasMountedRef = useRef(false);

  const clearSensitiveState = useCallback(() => {
    setMessage('');
    setSealedWhisper(null);
    setRecipient(null);
    setSignature(createSnowflakeSignature());
  }, []);

  const exitToLanding = useCallback(() => {
    clearSensitiveState();
    window.history.replaceState({}, '', '/');
    setCurrentView(View.LANDING);
  }, [clearSensitiveState]);

  const loadRecipientStatus = useCallback(async () => {
    if (!recipient?.fragmentSecret || !recipient.consumeToken) {
      setReceiveStatus('invalid');
      return;
    }

    setReceiveStatus('loading');
    try {
      const status = await getWhisperStatus(recipient.id, recipient.consistencyToken ?? undefined);
      if (status.status === 'gone') {
        setReceiveStatus('gone');
        return;
      }

      const isValidLink = await verifyFragmentSecret(status.keyEnvelope, recipient.fragmentSecret);
      if (!isValidLink) {
        setReceiveStatus('invalid');
        return;
      }

      setSignature(status.keyEnvelope.signature);
      setReceiveExpiresAt(status.expiresAt);
      setReceiveStatus('sealed');
    } catch {
      setReceiveStatus('offline');
    }
  }, [recipient]);

  useEffect(() => {
    if (recipient) void loadRecipientStatus();
  }, [loadRecipientStatus, recipient]);

  useEffect(() => {
    const sceneMap: Record<View, SoundScene> = {
      [View.LANDING]: 'landing',
      [View.COMPOSE]: 'encrypt',
      [View.SHARE_READY]: 'decrypt',
      [View.RECEIVE]: 'decrypt',
      [View.REVEALED]: 'decrypt',
      [View.GALLERY]: 'gallery',
      [View.AFTERGLOW]: 'afterglow',
    };
    setScene(sceneMap[currentView]);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    play('switch');
  }, [currentView, play, setScene]);

  useEffect(() => {
    document.title = `${t('common.appName')} | ${t('common.appSubtitle')}`;
    document.documentElement.lang = localeTag;
  }, [localeTag, t]);

  useEffect(() => {
    if ([View.LANDING, View.COMPOSE].includes(currentView)) return;
    window.scrollTo(0, 0);
    let focusTimer: number | undefined;
    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>('[data-view-heading]');
      if (heading && document.activeElement !== heading) heading.focus({ preventScroll: true });
    };
    const frame = window.requestAnimationFrame(() => {
      focusHeading();
      // A second guarded pass handles browsers that restore focus to <body>
      // after the navigation-triggering button has unmounted.
      focusTimer = window.setTimeout(focusHeading, 600);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
    };
  }, [currentView, receiveStatus]);

  const createWhisper = async (payload: ComposePayload) => {
    try {
      const sealed = await createOneTimeWhisper(payload);
      setSealedWhisper({
        id: sealed.id,
        signature: payload.signature,
        shareUrl: sealed.shareUrl,
        deleteToken: sealed.deleteToken,
        expiresAt: sealed.expiresAt,
      });
      setSignature(payload.signature);
      setCurrentView(View.SHARE_READY);
    } catch {
      throw new Error(t('compose.createFailed'));
    }
  };

  const revealWhisper = async () => {
    if (!recipient?.fragmentSecret || !recipient.consumeToken) {
      setReceiveStatus('invalid');
      return;
    }

    try {
      const opened = await consumeOneTimeWhisper(
        recipient.id,
        recipient.fragmentSecret,
        recipient.consumeToken,
        recipient.consistencyToken ?? undefined,
      );
      setMessage(opened.message);
      setSignature(opened.signature);
      setRecipient(null);
      window.history.replaceState({}, '', '/');
      setCurrentView(View.REVEALED);
    } catch (caught) {
      if (caught instanceof OneTimeWhisperConsumeUncertainError) {
        setReceiveStatus('uncertain');
        return;
      }
      if (caught instanceof OneTimeWhisperApiError) {
        if (caught.code === 'WHISPER_GONE') {
          setReceiveStatus('gone');
          return;
        }
        if (caught.code === 'INVALID_FRAGMENT_SECRET') {
          setReceiveStatus('invalid');
          return;
        }
        if (caught.code === 'INVALID_CONSUME_TOKEN') {
          setReceiveStatus('invalid');
          return;
        }
      }
      setReceiveStatus('offline');
      throw new Error(t('receive.openFailed'));
    }
  };

  const openAfterglow = (returnView: View) => {
    setAfterglowReturn(returnView);
    setCurrentView(View.AFTERGLOW);
  };

  const saveKeepsake = (nextSignature: string, origin: KeepsakeOrigin) => {
    collectKeepsake(nextSignature, origin);
    setCollectionRevision((revision) => revision + 1);
  };

  return (
    <div className="relative w-full min-h-[100svh] bg-background-dark">
      <div className="fixed inset-0 stardust-bg opacity-30 pointer-events-none z-0" />
      <div className="fixed -top-24 -left-24 w-[520px] h-[520px] bg-primary/10 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed -bottom-24 -right-24 w-[560px] h-[560px] bg-aurora-purple/10 blur-[160px] rounded-full pointer-events-none z-0" />

      {currentView === View.LANDING && (
        <LandingView
          onCrystallize={() => setCurrentView(View.COMPOSE)}
          onOpenGallery={() => setCurrentView(View.GALLERY)}
        />
      )}

      {currentView === View.COMPOSE && (
        <ComposeView onSubmit={createWhisper} onBack={exitToLanding} />
      )}

      {currentView === View.SHARE_READY && sealedWhisper && (
        <ShareReadyView
          whisper={sealedWhisper}
          onCreateAnother={() => {
            clearSensitiveState();
            setCurrentView(View.COMPOSE);
          }}
          onExport={() => openAfterglow(View.SHARE_READY)}
          isCollected={hasKeepsake(sealedWhisper.signature)}
          onCollect={() => saveKeepsake(sealedWhisper.signature, 'sent')}
          onRevoke={async (id, deleteToken) => {
            try {
              return await deleteOneTimeWhisper(id, deleteToken);
            } catch {
              throw new Error(t('shareReady.revokeFailed'));
            }
          }}
        />
      )}

      {currentView === View.RECEIVE && recipient && (
        <ReceiveView
          id={recipient.id}
          status={receiveStatus}
          expiresAt={receiveExpiresAt}
          signature={signature}
          onExit={exitToLanding}
          onRetry={loadRecipientStatus}
          onReveal={revealWhisper}
        />
      )}

      {currentView === View.REVEALED && (
        <RevealView
          message={message}
          signature={signature}
          onClose={exitToLanding}
          isCollected={hasKeepsake(signature)}
          onCollect={() => saveKeepsake(signature, 'received')}
          onExport={() => {
            setMessage('');
            openAfterglow(View.LANDING);
          }}
        />
      )}

      {currentView === View.GALLERY && (
        <SnowflakeGalleryView
          onBack={() => setCurrentView(View.LANDING)}
          onCreate={() => setCurrentView(View.COMPOSE)}
        />
      )}

      {currentView === View.AFTERGLOW && (
        <AfterglowView
          message={signature}
          signature={signature}
          onBack={() => setCurrentView(afterglowReturn)}
          onExit={exitToLanding}
        />
      )}
    </div>
  );
};

export default App;
