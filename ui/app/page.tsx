'use client';

import Image from 'next/image';
import styles from './page.module.css';
import { useCallback, useEffect, useState } from 'react';
import { Core } from '@walletconnect/core';
import { WalletKit, WalletKitTypes } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { reownProjectId } from '../config/env';

let walletKit: Awaited<ReturnType<typeof WalletKit.init>>;

export default function Home() {
  const [uri, setUri] = useState('');
  // const [wk, setWk] = useState<any>(null);

  useEffect(() => {
    initWk();
  }, []);

  const initWk = async () => {
    console.log('Initializing WalletKit...');
    const core = new Core({
      projectId: reownProjectId,
    });
    const metadata = {
      name: 'v1-wallet',
      description: 'AppKit Example',
      url: 'https://reown.com/appkit', // origin must match your domain & subdomain
      icons: ['https://assets.reown.com/reown-profile-pic.png'],
    };
    walletKit = await WalletKit.init({
      core,
      metadata,
    });

    console.log('WalletKit Initialized:', walletKit);
    walletKit.on('session_proposal', onSessionProposal);
    walletKit.on('session_request', onSessionRequest);
  };

  const onSessionProposal = async (proposal: WalletKitTypes.SessionProposal) => {
    console.log('Session Proposal:', proposal);
    const { id, params } = proposal;

    try {
      // ------- namespaces builder util ------------ //
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: {
          eip155: {
            chains: ['eip155:1', 'eip155:137'],
            // methods: ['eth_sendTransaction', 'personal_sign'],
            methods: ['labyrinth_signTransaction'],
            events: ['accountsChanged', 'chainChanged'],
            accounts: [
              'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
              'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
            ],
          },
        },
      });
      // ------- end namespaces builder util ------------ //
      console.log('wk on session', walletKit);

      const session = await walletKit.approveSession({
        id,
        namespaces: approvedNamespaces,
        sessionProperties: {
          viewKey: '0xabcd',
        },
      });
    } catch (error) {
      console.log('Session Approval Error:');
      console.error(error);
      await walletKit.rejectSession({
        id: proposal.id,
        reason: getSdkError('USER_REJECTED'),
      });
    }
  };

  const onSessionRequest = async (event: WalletKitTypes.SessionRequest) => {
    console.log('onSessionRequest', event);
    const { topic, params, id } = event;
    const { request } = params;
    const requestParamsMessage = request.params[0];
    const signedMessage =
      '0x7f5c4f07b516d75f79f4c251a6a523519cf7639dc1f40ef2fae77dc3937e7a7f3c38f2efdcaa02d7594c38e3dd2c2a113a97bb4b69ae1090d2ddc17e80ec94481c';
    const response = { id, result: signedMessage, jsonrpc: '2.0' };
    await walletKit.respondSessionRequest({ topic, response });
  };

  const handleConnect = async () => {
    if (!walletKit) {
      console.error('WalletKit not initialized');
      return;
    }

    try {
      const session = await walletKit.pair({ uri });
      console.log('Connected session:', session);
    } catch (error) {
      console.error('Connection Error:', error);
    }
  };

  const handleGetSessions = async () => {
    const sessions = await walletKit.getActiveSessions();
    console.log('walletKit', walletKit);
    console.log('Active Sessions:', sessions);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <input
          type="text"
          placeholder="Type something"
          width={400}
          onChange={(e) => setUri(e.target.value)}
        />
        <button type="button" onClick={handleConnect}>
          Connect
        </button>
        <button type="button" onClick={handleGetSessions}>
          Get Active Sessions
        </button>
      </main>
    </div>
  );
}
