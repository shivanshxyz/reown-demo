'use client';

import Image from 'next/image';
import styles from './page.module.css';
import { useCallback, useEffect, useState } from 'react';
import { Core } from '@walletconnect/core';
import { WalletKit, WalletKitTypes } from '@reown/walletkit';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import { SignClient } from '@walletconnect/sign-client';
import { reownProjectId } from '../config/env';

let signClient: Awaited<ReturnType<typeof SignClient.init>>;

export default function Home() {
  const [uri, setUri] = useState('');
  // const [wk, setWk] = useState<any>(null);

  useEffect(() => {
    initWk();
  }, []);

  const initWk = async () => {
    console.log('Initializing WalletKit...');
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

    const walletKit = await WalletKit.init({
      core: new Core({ projectId: reownProjectId }),
      metadata,
    });

    console.log('WalletKit Initialized:', signClient);
    signClient.on('session_proposal', onSessionProposal);
    signClient.on('session_request', onSessionRequest);
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
            chains: ['eip155:1'],
            methods: ['labyrinth_signTransaction'],
            // methods: [],
            events: ['accountsChanged', 'chainChanged'],
            accounts: [
              'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
              'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
            ],
          },
        },
      });
      // ------- end namespaces builder util ------------ //
      console.log('wk on session', signClient);

      const { topic, acknowledged } = await signClient.approve({
        id: proposal.id,
        namespaces: approvedNamespaces,
      });

      const session = await acknowledged();
      console.log('Session Approved:', session);

      //   const session = await signClient.approveSession({
      //     id,
      //     namespaces: approvedNamespaces,
      // sessionProperties: {
      //   viewKey: '',
      // },
      //   });
    } catch (error) {
      console.log('Session Approval Error:');
      console.error(error);
      await signClient.reject({
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
    await signClient.respond({ topic, response });
  };

  const handleConnect = async () => {
    if (!signClient) {
      console.error('WalletKit not initialized');
      return;
    }

    try {
      const session = await signClient.pair({ uri });
      console.log('Connected session:', session);
    } catch (error) {
      console.error('Connection Error:', error);
    }
  };

  const handleGetSessions = async () => {
    const sessions = await signClient.getActiveSessions();
    console.log('walletKit', signClient);
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
