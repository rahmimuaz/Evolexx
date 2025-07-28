import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios'; // Import axios for making HTTP requests
import './CardPaymentPage.css'; // Import your CSS styles

// Assuming useUser context provides user authentication details (like user.token)
import { useUser } from '../../context/UserContext'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Your backend API base URL

const CardPaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Get user from context for authentication
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // For Pay Now button loading
  const [isCardsLoading, setIsCardsLoading] = useState(true); // For loading saved cards
  const [savedCards, setSavedCards] = useState([]); // Now dynamic from MongoDB via API
  
  // No longer need userId and isAuthReady states as Firebase Auth is removed
  // Authentication will be handled by the user context and passed via headers.

  // Fetch saved cards from MongoDB API
  useEffect(() => {
    const fetchSavedCards = async () => {
      if (!user || !user.token) {
        setIsCardsLoading(false);
        // Optionally, redirect to login or show a message if user is not authenticated
        // toast.info("Please log in to view saved cards.");
        return;
      }

      setIsCardsLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`, // Send user token for authentication
          },
        };
        const response = await axios.get(`${API_BASE_URL}/api/cards`, config);
        setSavedCards(response.data); // Assuming API returns an array of saved cards
      } catch (error) {
        console.error("Error fetching saved cards:", error);
        toast.error("Failed to load saved cards.");
      } finally {
        setIsCardsLoading(false);
      }
    };

    fetchSavedCards();
    // Depend on user.token to refetch cards if user logs in/out or token changes
  }, [user?.token, API_BASE_URL]); 


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cardNumber || !expiryDate || !cvv || !cardHolderName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user || !user.token) {
        toast.error('You must be logged in to process payments.');
        navigate('/login'); // Redirect to login if not authenticated
        return;
    }

    setIsProcessing(true); // Start button loading
    toast.info('Processing payment...');

    try {
      // Simulate API call to process payment
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay

      const paymentData = {
        cardNumber: `************${cardNumber.slice(-4)}`, // Send masked card number to backend
        expiryDate,
        cvv: '***', // CVV should never be sent or stored in plain text
        cardHolderName,
        saveCard,
        // In a real app, integrate with a payment gateway here (e.g., Stripe token)
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`, // Send user token for authentication
        },
      };

      // Example API call to your MongoDB-backed backend for payment processing
      // This endpoint would handle payment gateway integration and optionally save card details
      const paymentResponse = await axios.post(`${API_BASE_URL}/api/payments/process`, paymentData, config);

      if (saveCard) {
        // If saving card is requested, make a separate API call to save card details
        // This assumes your /api/payments/process endpoint doesn't automatically save.
        // If it does, you can remove this block.
        const savedCardData = {
          last4: cardNumber.slice(-4),
          brand: getCardBrand(cardNumber),
          expiry: expiryDate,
          cardHolderName: cardHolderName,
          // NEVER store full card number or CVV in real applications!
        };
        await axios.post(`${API_BASE_URL}/api/cards`, savedCardData, config);
        toast.success('Card saved successfully!');
      }

      toast.success('Payment successful!');
      navigate('/checkout'); // Navigate to checkout or order confirmation page
    } catch (error) {
      console.error("Payment or card save failed:", error.response?.data || error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false); // End button loading
    }
  };

  const selectSavedCard = (card) => {
    // Populate form fields from selected saved card (excluding CVV for security)
    setCardNumber(`************${card.last4}`); // Show masked number
    setExpiryDate(card.expiry);
    setCvv(''); // CVV should never be stored, so it must be re-entered by the user
    setCardHolderName(card.cardHolderName || '');
    setSaveCard(false); // Assume user doesn't want to re-save an already saved card by default
    toast.info(`Selected saved card ending in ${card.last4}. Please enter CVV.`);
  };

  const deleteSavedCard = async (cardId) => {
    if (!user || !user.token) {
      toast.error("You must be logged in to delete cards.");
      return;
    }

    // IMPORTANT: Do NOT use confirm() or alert() in production. Use a custom modal UI.
    if (window.confirm("Are you sure you want to delete this saved card?")) {
      setIsCardsLoading(true); // Show loading while deleting
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.delete(`${API_BASE_URL}/api/cards/${cardId}`, config);
        toast.success("Card deleted successfully!");
        // The `useEffect` will automatically refetch and update `savedCards`
      } catch (error) {
        console.error("Error deleting card:", error.response?.data || error);
        toast.error(error.response?.data?.message || "Failed to delete card.");
      } finally {
        setIsCardsLoading(false); // Hide loading
      }
    }
  };

  // Helper to determine card brand (basic example)
  const getCardBrand = (number) => {
    // This is a very basic check and not comprehensive
    const visaRegex = /^4/;
    const mastercardRegex = /^5[1-5]/;
    const amexRegex = /^3[47]/;

    if (visaRegex.test(number)) return 'Visa';
    if (mastercardRegex.test(number)) return 'MasterCard';
    if (amexRegex.test(number)) return 'Amex';
    return 'Unknown';
  };

  return (
    <div className="card-payment-page-container">
      <div className="payment-card">
        <h1 className="main-title">Card Payment</h1>

        {isCardsLoading ? (
          <div className="loading-cards">
            <div className="spinner-button"></div>
            <p>Loading saved cards...</p>
          </div>
        ) : (
          savedCards.length > 0 && (
            <div className="saved-cards-section">
              <h2 className="section-title">Your Saved Cards</h2>
              <div className="saved-cards-grid">
                {savedCards.map(card => (
                  <div
                    key={card.id}
                    className="saved-card-item"
                    onClick={() => selectSavedCard(card)}
                  >
                    <div>
                      <p className="saved-card-brand-last4">{card.brand} **** {card.last4}</p>
                      <p className="saved-card-expiry">Expires: {card.expiry}</p>
                    </div>
                    <button
                      type="button"
                      className="delete-card-button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selecting the card when deleting
                        deleteSavedCard(card.id);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="delete-icon">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L4.74 5.959m1.217-4.238a1.5 1.5 0 011.066-.811h11.334c.576 0 1.066.334 1.066.811M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L4.74 5.959m1.217-4.238a1.5 1.5 0 011.066-.811h11.334c.576 0 1.066.334 1.066.811M14.74 9l-.346 9m-4.788 0L9.26 9" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}


        <h2 className="section-title">Enter New Card Details</h2>
        <form onSubmit={handleSubmit} className="new-card-form">
          <div className="form-field">
            <label htmlFor="cardNumber" className="form-label">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
              maxLength="19"
              placeholder="XXXX XXXX XXXX XXXX"
              className="form-input"
              required
            />
          </div>

          <div className="grid-cols-2-gap-6">
            <div className="form-field">
              <label htmlFor="expiryDate" className="form-label">Expiry Date (MM/YY)</label>
              <input
                type="text"
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value.replace(/\D/g, '').replace(/^(\d{2})/, '$1/').substring(0, 5))}
                maxLength="5"
                placeholder="MM/YY"
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="cvv" className="form-label">CVV</label>
              <input
                type="text"
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                maxLength="4"
                placeholder="XXX"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cardHolderName" className="form-label">Cardholder Name</label>
            <input
              type="text"
              id="cardHolderName"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              placeholder="Full name on card"
              className="form-input"
              required
            />
          </div>

          <div className="checkbox-container">
            <input
              id="saveCard"
              name="saveCard"
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor="saveCard" className="checkbox-label">
              Save this card for future payments
            </label>
          </div>

          <button
            type="submit"
            className="pay-now-button"
            disabled={isProcessing} // Disable button during processing
          >
            {isProcessing ? <span className="spinner-button" /> : 'Pay Now'}
          </button>
        </form>

        <button
          onClick={() => navigate('/checkout')}
          className="back-to-checkout-button"
        >
          Back to Checkout
        </button>
      </div>
    </div>
  );
};

export default CardPaymentPage;
