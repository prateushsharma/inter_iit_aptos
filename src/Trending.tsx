import React, { useEffect, useState } from 'react';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Layout, Row, Col, Button, Input, Card, Typography, message } from "antd";
import { Aptos } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

const wallets = [new PetraWallet()];
const { Text } = Typography;
const aptos = new Aptos();
const moduleAddress = "68596da6c295086e8d125b4689e96a9532cc81f0b6ac9dc9913436c884d49081";

export default function TrendingAudioMarketplace() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [audios, setAudios] = useState<any[]>([]);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (account) {
      checkProfileInitialization();
    }
  }, [account]);

  const checkProfileInitialization = async () => {
    if (!account) return false;

    try {
      const result = await aptos.view({
        payload: {
          function: `${moduleAddress}::image_sharing::is_profile_initialized`,
          functionArguments: [account.address],
        },
      });

      const isInitialized = result[0] as boolean;
      setIsInitialized(isInitialized);
      if (isInitialized) {
        fetchAudios();
      }
      return isInitialized;
    } catch (error: any) {
      console.error("Error checking profile initialization:", error);
      setIsInitialized(false);
      return false;
    }
  };

  const initializeProfile = async () => {
    if (!account) return;

    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::initialize_profile`,
        functionArguments: [],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setIsInitialized(true);
      message.success("Profile initialized successfully!");
      fetchAudios();
    } catch (error: any) {
      const errorMessage = error?.message || "";
      if (errorMessage.includes("already initialized")) {
        setIsInitialized(true);
        message.info("Profile is already initialized.");
      } else {
        console.error("Error initializing profile:", error);
        message.error("Failed to initialize profile. Please try again.");
      }
    } finally {
      setTransactionInProgress(false);
    }
  };

  const likeAudio = async (audioId: number) => {
    if (!account || !isInitialized) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::like_image`,
        functionArguments: [audioId]
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      message.success("Audio liked successfully!");
      fetchAudios();
    } catch (error: any) {
      console.error("Error liking audio:", error);
      message.error("Failed to like audio. Please try again.");
    } finally {
      setTransactionInProgress(false);
    }
  };

  const tipAudio = async (audioId: number) => {
    if (!account || !isInitialized) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::tip_image`,
        functionArguments: [audioId, tipAmount]
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      message.success("Tip sent successfully!");
      fetchAudios();
    } catch (error: any) {
      console.error("Error sending tip:", error);
      message.error("Failed to send tip. Please try again.");
    } finally {
      setTransactionInProgress(false);
    }
  };

  const fetchAudios = async () => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${moduleAddress}::image_sharing::get_all_image_ids`,
          functionArguments: []
        }
      });
      const audioIds = result[0] as number[];
      const audioPromises = audioIds.map(id => 
        aptos.view({
          payload: {
            function: `${moduleAddress}::image_sharing::get_image_info`,
            functionArguments: [id]
          }
        })
      );
      const audioInfos = await Promise.all(audioPromises);
      const sortedAudios = audioInfos
      .map((info, index) => ({
        id: audioIds[index],
        owner: info[0],
        ipfsHash: info[1],
        description: info[2],
        likes: Number(info[3]),
        tipsReceived: Number(info[4]),
      }))
      .filter(audio => audio.likes > 0) // Keep audios with likes greater than 0
      .sort((a, b) => b.likes - a.likes); // Sort by likes in descending order
    
      setAudios(sortedAudios);
    } catch (error: any) {
      console.error("Error fetching audios:", error);
    }
  };

  return (
    <Layout>
      <div className="audio-marketplace">
        <h1 className="title">TRENDING ON CHAIN RADIO</h1>
        
        {!account ? (
          <div className="connect-wallet">
            <Text>Please connect your wallet to use the app</Text>
            <WalletSelector />
          </div>
        ) : !isInitialized ? (
          <div className="initialize-profile">
            <Text>Your profile is not initialized. Please initialize to use the app.</Text>
            <Button onClick={initializeProfile} loading={transactionInProgress}>
              Initialize Profile
            </Button>
          </div>
        ) : (
          <Row gutter={[24, 24]} className="audio-grid">
            {audios.map((audio, index) => (
              <Col xs={24} sm={12} md={12} lg={12} key={audio.id}>
                <Card
                  className={`audio-card card-${index % 5}`}
                  hoverable
                  cover={
                    <div className="audio-player">
                      <audio controls className="audio-controls">
                        <source src={`https://blue-personal-vulture-528.mypinata.cloud/ipfs/${audio.ipfsHash}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  }
                >
                  <Card.Meta
                    title={<span className="audio-owner">{audio.owner}</span>}
                    description={<span className="audio-description">{audio.description}</span>} 
                  />
                  <div className="audio-stats">
                    <Text className="likes">{`❤️ ${audio.likes}`}</Text>
                    <Text className="tips">{`💰 ${audio.tipsReceived} APT`}</Text>
                  </div>
                  <div className="audio-actions">
                    <Button onClick={() => likeAudio(audio.id)} className="like-btn">
                      Like
                    </Button>
                    <div className="tip-action">
                      <Input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(Number(e.target.value))}
                        placeholder="Tip"
                        className="tip-input"
                      />
                      <Button onClick={() => tipAudio(audio.id)} className="tip-btn">
                        Tip
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        :root {
          --color-1: #ff6b6b;
          --color-2: #4ecdc4;
          --color-3: #45d3ff;
          --color-4: #ff9ff3;
          --color-5: #feca57;
          --address-white: #ffffff;
          --address-red: #ff0000;
          --likes-tips-color: #009688;
        }

        .audio-marketplace {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Poppins', sans-serif;
        }

        .title {
          font-size: 4rem;
          background: linear-gradient(45deg, var(--color-1), var(--color-2), var(--color-3), var(--color-4), var(--color-5));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-align: center;
          margin-bottom: 2rem;
          animation: rainbow 5s linear infinite;
        }

        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .audio-grid {
          margin-top: 2rem;
        }

        .audio-card {
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 15px !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
          transition: all 0.3s ease !important;
        }

        .audio-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
        }

        .card-0 { border-top: 4px solid var(--color-1) !important; }
        .card-1 { border-top: 4px solid var(--color-2) !important; }
        .card-2 { border-top: 4px solid var(--color-3) !important; }
        .card-3 { border-top: 4px solid var(--color-4) !important; }
        .card-4 { border-top: 4px solid var(--color-5) !important; }

        .audio-player {
          background-color: transparent;
          padding: 10px;
          border-radius: 10px;
        }

        .audio-player audio {
          width: 100%;
          margin-bottom: 1rem;
          border-radius: 10px;
          background-color: transparent;
        }

        .audio-stats {
          display: flex;
          justify-content: space-between;
          margin: 1rem 0;
        }

        .likes, .tips {
          color: var(--likes-tips-color);
          font-weight: bold;
        }

        .audio-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tip-input {
          width: 80px;
          margin-right: 0.5rem;
        }

        .like-btn, .tip-btn {
          background: var(--color-3);
          border: none;
          color: white;
          border-radius: 5px;
          padding: 0.5rem 1rem;
          transition: background 0.3s ease;
        }

        .like-btn:hover, .tip-btn:hover {
          background: var(--color-2);
        }

        .audio-owner {
          color: var(--address-white);
          text-shadow: 1px 1px 2px var(--address-red);
        }

        .audio-description {
          background: linear-gradient(45deg, var(--color-1), var(--color-2), var(--color-3), var(--color-4), var(--color-5));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .connect-wallet, .initialize-profile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          gap: 1rem;
        }

        .upload-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .upload-section .ant-input {
          flex: 1;
        }

        .upload-section .ant-btn {
          flex-shrink: 0;
        }
      `}</style>
    </Layout>
  );
}