'use client';

import { useSignMessage } from 'wagmi';
import styles from './page.module.css';
import { SignClient } from '@walletconnect/sign-client';
import { reownProjectId } from '@/config/env';
import { useEffect, useState } from 'react';
import { useAppKitState } from '@reown/appkit/vue';
import { appKitModal } from '@/context/wagmi';

// type SessionTypeStruct = Awaited<ReturnType<typeof SignClient.init>>;
let signClient: Awaited<ReturnType<typeof SignClient.init>>;

export default function Home() {
  const { signMessageAsync } = useSignMessage();
  const [session, setSession] = useState<any>();
  // const { se } = useAppKitState();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    console.log('Initializing sign client...');
    const metadata = {
      name: 'v1-wallet',
      description: 'AppKit Example',
      url: 'https://reown.com/appkit', // origin must match your domain & subdomain
      icons: ['https://assets.reown.com/reown-profile-pic.png'],
    };
    signClient = await SignClient.init({
      projectId: reownProjectId,
      metadata,
    });

    console.log('WalletKit Initialized:', signClient);
    signClient.on('session_event', (e) => {
      console.log('Session Event:', e);
    });
  };

  const handleSign = async () => {
    const message = 'Hello, World!';
    const signature = await signMessageAsync({ message });
    console.log('Signature:', signature);
  };

  const handleReq = async () => {
    const payload = { a: 1, b: { c: '0xabcd' } };
    const response = await signClient.request({
      topic: session.topic,
      // topic: signClient.session,
      chainId: 'eip155:1',
      request: {
        method: 'labyrinth_signTransaction',
        params: [payload],
      },
    });

    console.log('Req Response:', response);
  };

  const handleConnect = async () => {
    console.log('Connecting...');
    try {
      const { uri, approval } = await signClient.connect({
        // Optionally: pass a known prior pairing (e.g. from `signClient.core.pairing.getPairings()`) to skip the `uri` step.
        // pairingTopic: pairing?.topic,
        // Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
        requiredNamespaces: {
          eip155: {
            chains: ['eip155:1'],
            methods: ['labyrinth_signTransaction'],
            events: ['accountsChanged', 'chainChanged'],
          },
        },
      });

      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        console.log('URI:', uri);
        await navigator.clipboard.writeText(uri);
        await appKitModal.open({ view: 'Connect' });
        console.log('QRCode copied to clipboard:', uri);

        // walletConnectModal.openModal({ uri });
        // Await session approval from the wallet.
        const session = await approval();
        setSession(session);
        console.log('Session approved:', session);

        // Handle the returned session (e.g. update UI to "connected" state).
        // * You will need to create this function *
        // onSessionConnect(session);
        // Close the QRCode modal in case it was open.
        // walletConnectModal.closeModal();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* <w3m-button /> */}
        <button type="button" onClick={handleConnect}>
          Connect
        </button>
        <button type="button" onClick={handleReq}>
          Send Req
        </button>
        <button type="button" onClick={handleSign}>
          Sign Message
        </button>
      </main>
    </div>
  );
}
