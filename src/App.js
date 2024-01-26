import React, {useState, useEffect, useCallback} from 'react';
import './App.css'; // Import your CSS file for styling
import { ConcordiumGRPCWebClient, credentials} from '@concordium/web-sdk';

// Import your components
import DonationPage from './DonationPage';
import DonationProcess from './DonationProcess';
import ImpactUpdates from './ImpactUpdates';
import DonationTracking from './DonationTracking';

const App = () => {
  // Initialize Concordium client here (make sure to include proper state management for credentials)
  // State for managing credentials (you may use a more secure storage method)
  //const [credentials, setCredentials] = useState({
    //privateKey: '', // Placeholder for the private key or wallet connection details
 // });

  // State for Concordium client
  const [concordiumClient, setConcordiumClient] = useState(null);

  // State for donation history
  const [donationHistory, setDonationHistory] = useState([]);

  
  // Helper function to create Concordium GRPC Node Client
  const createConcordiumClient = useCallback((address, port, privateKey) => {
    return new ConcordiumGRPCWebClient(
      address,
      port,
      credentials.createSsl(),
      { timeout: 15000 }
    );
  }, [])

 // Effect to initialize Concordium client when credentials change
 useEffect(() => {
  if (credentials.privateKey) {
    const client = createConcordiumClient('https://concordium-node.example.com', 8882, credentials.privateKey);
    setConcordiumClient(client);
  }
}, [ createConcordiumClient]);



   // Fetch donation history when Concordium client changes
   useEffect(() => {
    fetchDonationHistory(concordiumClient);
  }, [concordiumClient]);

  // Function to fetch donation history using Concordium client
  const fetchDonationHistory = async (client) => {
    try {
      // Assuming your smart contract has a method to retrieve donation history
      const history = await client.getDonationHistory();
      setDonationHistory(history);
    } catch (error) {
      console.error('Error fetching donation history:', error);
      // Handle errors or display a message to the user
    }
  };


  // Effect to listen for impact updates when Concordium client changes
  useEffect(() => {
    listenForImpactUpdates(concordiumClient);
  }, [concordiumClient]);

  // Function to donate to charity using Concordium client
  const donateToCharity = async (amount, charityAddress) => {
    try {
      if (!concordiumClient) {
        throw new Error('Concordium client is not initialized.');
      }

      // Create a new transaction
      const transaction = concordiumClient.newTransaction();

      // Add donation details to the transaction
      transaction.addTransfer({ amount, sender: credentials.address, recipient: charityAddress });

      // Sign and submit the transaction
      const signedTransaction = await transaction.sign();
      await concordiumClient.submitTransaction(signedTransaction);

      // Update local donation records immediately after a successful donation
      fetchDonationHistory(concordiumClient);

      // You can perform additional actions after a successful donation if needed
    } catch (error) {
      console.error('Error donating to charity:', error);
      // Handle errors or display a message to the user
    }
  };

  // Function to listen for impact updates using Concordium client
  const listenForImpactUpdates = (client) => {
      if (!client) {
        return; // Return early if the client is not initialized yet
      }

       // Set up a subscription to receive real-time impact updates from the blockchain
      const unsubscribe = client.subscribeToImpactUpdates((update) => {
        // Update impact information in your application
        console.log('Impact Update:', update);
        // You can set state, trigger UI updates, or perform other actions here
      });

      // Cleanup function to unsubscribe when the component unmounts or client changes
      return () => {
        unsubscribe();
      };
  };


  return (
    <div className="app-container">
      {/* DonationPage component with donateToCharity function passed as prop */}
      <DonationPage donateToCharity={donateToCharity}/>
      <DonationProcess />
      <ImpactUpdates />
      <DonationTracking donationHistory={donationHistory}/>
    </div>
  );
};

export default App;
