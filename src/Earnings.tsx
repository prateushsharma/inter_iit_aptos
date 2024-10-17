'use client'

import React, { useEffect, useState } from 'react';
import { Aptos } from "@aptos-labs/ts-sdk";
import { Button, Typography, Row, Col, Card,Layout,Input,message } from "antd";
import { useWallet,InputTransactionData } from "@aptos-labs/wallet-adapter-react";

const { Text } = Typography;
const aptos = new Aptos();

const moduleAddress = "bda589a2cf465ca89de6768c009a21b00673f88e9eef3a377d89f7d087453491";

interface ImageInfo {
  id: number;
  owner: string;
  ipfsHash: string;
  description: string;
  likes: number;
  tipsReceived: number;
}

function Earnings() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const { account, signAndSubmitTransaction } = useWallet();
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  useEffect(() => {
    if (account) {
        // Run this check when the account is available
        checkProfileInitialization();
    }
}, [account]); // Add account as dependency to ensure it runs when the account changes

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
        console.log("Profile initialized successfully");
        setIsInitialized(true);
        message.success("Profile initialized successfully!");
        fetchImages();
    } catch (error: any) {
        // Check if error has a 'message' property and handle accordingly
        const errorMessage = error?.message || "";
        
        // Handle "already initialized" error cleanly
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

 
const checkProfileInitialization = async () => {
    if (!account) return false;

    const accountAddress = account.address;
    console.log('Checking profile initialization for account:', accountAddress);

    try {
        const result = await aptos.view({
            payload: {
                function: `${moduleAddress}::image_sharing::is_profile_initialized`,
                functionArguments: [accountAddress],
            },
        });

        console.log('View result:', result);

        if (result && result.length > 0) {
            const isInitialized = result[0] as boolean;
            console.log('Profile initialized:', isInitialized);

            setIsInitialized(isInitialized);
            fetchImages(); // Fetch images if profile is initialized
            return isInitialized;
        } else {
            console.log('Profile not initialized, setting to false.');
            setIsInitialized(false);
            return false;
        }
    } catch (error: any) {
        console.error("Error checking profile initialization:", error);
        setIsInitialized(false);
        return false;
    }
};








  const fetchImages = async () => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${moduleAddress}::image_sharing::get_all_image_ids`,
          functionArguments: []
        }
      });
      const imageIds = result[0] as number[];
      const imagePromises = imageIds.map(id =>
        aptos.view({
          payload: {
            function: `${moduleAddress}::image_sharing::get_image_info`,
            functionArguments: [id]
          }
        })
      );
      const imageInfos = await Promise.all(imagePromises);
      
      if (account) {
        const userImages = imageInfos
          .map((info, index) => ({
            id: imageIds[index],
            owner: String(info[0]), // Convert to string
            ipfsHash: String(info[1]), // Convert to string
            description: String(info[2]), // Convert to string
            likes: Number(info[3]),
            tipsReceived: Number(info[4])
          }))
          .filter(image => image.owner === account.address);
  
        setImages(userImages);
  
        const earnings = userImages.reduce((total, image) => total + image.tipsReceived, 0);
        setTotalEarnings(earnings);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };
  

  useEffect(() => {
    fetchImages();
  }, [account]);

  // Find the most earned image
  const mostEarnedImage = images.reduce((prev, current) => {
    return (prev.tipsReceived > current.tipsReceived) ? prev : current;
  }, images[0]);

  // Filter out the most earned image from the remaining images
  const remainingImages = images.filter(image => image.id !== mostEarnedImage?.id);
  const likeImage = async (imageId: number) => {
    if (!account || !isInitialized) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::like_image`,
        functionArguments: [imageId]
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log("Image liked successfully");
      message.success("Image liked successfully!");
      fetchImages();
    } catch (error: any) {
      console.error("Error liking image:", error);
      message.error("Failed to like image. Please try again.");
    } finally {
      setTransactionInProgress(false);
    }
  };

  const tipImage = async (imageId: number) => {
    if (!account || !isInitialized) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::tip_image`,
        functionArguments: [imageId, tipAmount]
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log("Tip sent successfully");
      message.success("Tip sent successfully!");
      fetchImages();
    } catch (error: any) {
      console.error("Error sending tip:", error);
      message.error("Failed to send tip. Please try again.");
    } finally {
      setTransactionInProgress(false);
    }
  };
  return (
    <Layout>
      <div className="audio-marketplace">
       
        {!account ? (
          <div className="connect-wallet">
            <Text>Please connect your wallet to view your earnings.</Text>
            <Button>Connect Wallet</Button>
          </div>
        ) : (
          <>
            <div className="title" >
               
            Total Earnings: {totalEarnings} APT
            </div>
  
            <Row gutter={[24, 24]} className="audio-grid">
              {/* Most Earned Audio Card */}
              {mostEarnedImage && (
                <Col xs={24} sm={12} md={8} lg={8}>
                  <Card
                    className="audio-card most-earned-card"
                    hoverable
                    cover={
                      <div className="audio-player">
                        <audio controls className="audio-controls">
                          <source src={`https://blue-personal-vulture-528.mypinata.cloud/ipfs/${mostEarnedImage.ipfsHash}`} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    }
                  >
                    <Card.Meta
                      title={<span className="audio-owner">{mostEarnedImage.owner}</span>}
                      description={<span className="audio-description">{mostEarnedImage.description}</span>} 
                    />
                    <div className="audio-stats">
                       <span className="audio-owner"> Most Earned Audio</span>
                      <Text className="likes">{`❤️ ${mostEarnedImage.likes}`}</Text>
                      <Text className="tips">{`💰 ${mostEarnedImage.tipsReceived} APT`}</Text>
                    </div>
                  </Card>
                </Col>
              )}
  
              {/* Remaining Audio Cards */}
              {remainingImages.map((audio, index) => (
                <Col xs={24} sm={12} md={8} lg={8} key={audio.id}>
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
                  
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
  
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
.total-earnings {
  font-size: 6rem;
  color: white;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  background: black;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: pulse 1.5s infinite;
  text-align: center;
  margin-bottom: 2rem;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
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
      </div>
    </Layout>
  );
  
  
}

export default Earnings;
