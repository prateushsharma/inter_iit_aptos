import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Input, Button, message } from 'antd';
import { Aptos } from "@aptos-labs/ts-sdk";
import {  Typography } from "antd";
const { Text } = Typography;
const aptos = new Aptos();

const Upload = () => {
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
  const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY;
  const { account, signAndSubmitTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const moduleAddress = "0xbda589a2cf465ca89de6768c009a21b00673f88e9eef3a377d89f7d087453491";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

 

  const uploadToBlockchain = async (imgHash: string) => {
    if (!account || !imgHash || !description) return;

    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::upload_image`,
        functionArguments: [imgHash, description]
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log("Audio uploaded to blockchain successfully");
      message.success("Audio uploaded to blockchain successfully!");
       
    } catch (error) {
      console.error("Error uploading audio to blockchain:", error);
      message.error("Failed to upload audio to blockchain.");
    } finally {
      setTransactionInProgress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const imgHash = await uploadToIPFS();
    if (imgHash) {
      await uploadToBlockchain(imgHash);
    }
  };
//   const checkInitialization = async () => {
//     if (!account) return;
//     try {
//       const result = await aptos.view({
//         payload: {
//           function: `${moduleAddress}::image_sharing::init_module`,
//           functionArguments: []
//         }
//       });
//       setIsInitialized(true);
     
//     } catch (error: any) {
//       console.log("User profile not initialized");
//       setIsInitialized(false);
//     }
//   };
//   useEffect(() => {
//     if (account) {
//       checkInitialization();
//     }
//   }, [account]);

//   const initializeProfile = async () => {
//     if (!account) return;
//     setTransactionInProgress(true);
    
//     const transaction: InputTransactionData = {
//       data: {
//         function: `${moduleAddress}::image_sharing::initialize_profile`,
//         functionArguments: []
//       }
//     };

//     try {
//       const response = await signAndSubmitTransaction(transaction);
//       await aptos.waitForTransaction({ transactionHash: response.hash });
//       console.log("Profile initialized successfully");
//       setIsInitialized(true);
//       message.success("Profile initialized successfully!");
     
//     } catch (error: any) {
//       console.error("Error initializing profile:", error);
//       message.error("Failed to initialize profile. Please try again.");
//     } finally {
//       setTransactionInProgress(false);
//     }
//   };
  const initializeProfile = async () => {
    if (!account) return;
    setTransactionInProgress(true);
  
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::image_sharing::initialize_profile`,
        functionArguments: []
      }
    };
  
    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log("Profile initialized successfully");
      setIsInitialized(true);
      message.success("Profile initialized successfully!");
     
    } catch (error: any) {
      // Check if the error is related to profile already being initialized
      if (error.message.includes("E_ALREADY_INITIALIZED")) {
        console.log("Profile already initialized");
        setIsInitialized(true);
        message.warning("Profile already initialized!");
       
      } else {
        console.error("Error initializing profile:", error);
        message.error("Failed to initialize profile. Please try again.");
      }
    } finally {
      setTransactionInProgress(false);
    }
  };
 
  const checkProfileInitialization = async () => {
    if (!account) return false; // Ensure the account is available
  
    const accountAddress = account.address; // Get the address from the account
  
    try {
      const result = await aptos.view({
        payload: {
          function: `${moduleAddress}::image_sharing::is_profile_initialized`,
          functionArguments: [accountAddress] // Pass the address here
        }
      });
  
      // Assuming result is an array where the first element is a boolean
     
      setIsInitialized(result[0] as boolean);
      return result.length > 0 && (result[0] as boolean); // Returns true if initialized, false otherwise
    } catch (error: any) {
      console.error("Error checking profile initialization:", error);
     
      setIsInitialized(false);
      return false; // Assume not initialized if there's an error
    }
  };
  useEffect(() => {
    if (account) {
        checkProfileInitialization();
    }
  }, [account]);
  
  const uploadToIPFS = async () => {
    if (!file) {
      message.error("Please select an audio file to upload.");
      return;
    }
    setTransactionInProgress(true);
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const resFile = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: 'ff70fc4db44308b757db', // Ensure these keys are valid
          pinata_secret_api_key: 'f9dab8fb5e51e32150c16eb7f4bb4a0a49f1efd66db10acb1134e4b644c8d7d2',
          "Content-Type": "multipart/form-data",
        },
      });
  
      const imgHash = `${resFile.data.IpfsHash}`;
      setIpfsHash(imgHash);
      setTransactionInProgress(false);
      message.success("File uploaded to IPFS successfully!");
      return imgHash;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      message.error("Failed to upload file to IPFS.");
    }
  };
  
  // Example usage in your initializeProfile function remains the same.
  
  

  return (
    <>
   
       {!isInitialized ?(
         <div className="initialize-profile">
         <Text>Your profile is not initialized. Please initialize to use the app.</Text>
         <Button onClick={initializeProfile} loading={transactionInProgress}>
           Initialize Profile
         </Button>
       </div>
       ):(

       
   
    <div className="upload-container">
      <h2 className="upload-title">Upload Your Track</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-wrapper">
          <input type="file" accept="audio/*" onChange={handleFileChange} required id="file-input" className="file-input" />
          <label htmlFor="file-input" className="file-input-label">
            <span className="upload-icon">&#x2B06;</span>
            <span>{file ? file.name : 'Choose audio file'}</span>
          </label>
        </div>
        <Input 
          placeholder="Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          className="description-input"
          required
        />
        <Button type="primary" htmlType="submit" loading={transactionInProgress} className="upload-button">
          Upload to Blockchain
        </Button>
      </form>
      <style >{`
        .upload-container {
          background: linear-gradient(135deg, #1e1e2f 0%, #2c2c54 100%);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          max-width: 500px;
          margin: 2rem auto;
        }

        .upload-title {
          color: #fff;
          font-size: 2rem;
          text-align: center;
          margin-bottom: 2rem;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        }

        .file-input {
          position: absolute;
          left: -9999px;
        }

        .file-input-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 20px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          color: white;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-input-label:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        .upload-icon {
          font-size: 1.5rem;
        }

        .description-input {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: rgb(164, 66, 245);
          padding: 10px;
          border-radius: 5px;
        }

        .description-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .upload-button {
          background: linear-gradient(45deg, #4ecdc4, #45d3ff);
          border: none;
          color: white;
          padding: 10px 20px;
          font-size: 1rem;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        @keyframes glow {
          0% {
            box-shadow: 0 0 5px rgba(78, 205, 196, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(78, 205, 196, 0.8);
          }
          100% {
            box-shadow: 0 0 5px rgba(78, 205, 196, 0.5);
          }
        }

        .upload-container {
          animation: glow 3s infinite;
        }
      `}</style>
    </div>
       )}
    </>
  )

};

export default Upload;