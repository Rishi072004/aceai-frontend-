import { Check, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./Pricing.css";
import { useEffect, useState } from "react";

const Pricing = () => {
  const { token, setUser, user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE_URL}/api/payments/plans`);
        const data = await res.json();
        if (data && data.data && data.data.plans) {
          setPlans(data.data.plans);
        }
      } catch (e) {
        console.error('Failed to load plans', e);
      }
    };
    loadPlans();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });
  };

  const buyPlan = async (planId) => {
    // All plans (including Starter) go through payment flow
    if (!token) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to purchase a plan.",
      });
      return;
    }

    // Normalize plan ID to match backend (STARTER, VALUE, UNLIMITED)
    const normalizedPlanId = planId.toUpperCase();

    // Enable fake payment flow for testing without Razorpay.
    // Set VITE_ENABLE_FAKE_PAYMENTS="true" to skip Razorpay in any environment.
    // Set VITE_ENABLE_FAKE_PAYMENTS="false" to force real Razorpay.
    const enableFakePayments = import.meta.env.VITE_ENABLE_FAKE_PAYMENTS === 'true';

    if (enableFakePayments) {
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ planId: normalizedPlanId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create (fake) order');

        // When ENABLE_FAKE_PAYMENTS is true on the backend, create-order
        // directly grants credits and returns the updated user.
        if (data.data && data.data.user) {
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        toast({
          title: "Plan activated (test mode)",
          description: "Credits added without real payment.",
          variant: "default",
        });

        if (normalizedPlanId === 'STARTER') {
          navigate('/interview', { state: { starterMode: true, planType: 'starter' } });
        }
      } catch (err) {
        console.error('Test payment error', err);
        toast({
          variant: "destructive",
          title: "Test payment failed",
          description: err.message || "Could not activate plan in test mode.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId: normalizedPlanId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create order');

      const { order, razorpayKeyId } = data.data;

      await loadRazorpayScript();

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AceAi',
        description: 'Purchase plan',
        order_id: order.id,
        handler: async function (response) {
          // Verify payment with backend
          try {
            const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Verification failed');

            // Update frontend user
            if (verifyData.data && verifyData.data.user) {
              setUser(verifyData.data.user);
              localStorage.setItem('user', JSON.stringify(verifyData.data.user));
            }
            toast({
              title: "Payment Successful! 🎉",
              description: "Credits have been added to your account.",
              variant: "default",
            });

            // After successful Starter purchase, go directly to interview flow
            if (normalizedPlanId === 'STARTER') {
              navigate('/interview', { state: { starterMode: true, planType: 'starter' } });
            }
          } catch (err) {
            console.error('Verification error', err);
            toast({
              variant: "destructive",
              title: "Verification Failed",
              description: "Payment succeeded but verification failed. Please contact support.",
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window. No charges were made.",
            });
            console.log('Checkout closed');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failures
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: response.error.description || "Payment could not be processed. Please try again.",
        });
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message || "An error occurred while processing your payment. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback plans with curated features and taglines (used if backend plans aren't available)
  const defaultPlans = [
    {
      id: "starter",
      name: "Starter",
      priceInRupees: 50,
      tagline: "Try 2 voice interviews",
      features: [
        "2 interviews (25 mins each)",
        "Basic feedback report",
        "Role-based questions",
      ],
      highlighted: false,
    },
    {
      id: "value",
      name: "Value for Money",
      priceInRupees: 299,
      tagline: "Best for most users",
      features: [
        "15 interviews (50 mins, ~30 questions each)",
        "Detailed feedback report",
        "Resume-based + role-based questions",
        "History of past interviews",

      ],
      highlighted: true,
    },
  ];

  const planTaglines = {
    Starter: "Try 2 voice interviews",
    "Value for Money": "Best for most users",
  };

  const featuresForPlan = (name) => {
    switch (name) {
      case "Starter":
        return [
          "2 interviews (25 mins each)",
          "Basic feedback report",
          "Role-based questions",
        ];
      case "Value for Money":
        return [
          "15 interviews (50 mins, ~30 questions each)",
          "Detailed feedback report",
          "Resume-based + role-based questions",
          "History of past interviews",
        ];
      default:
        return [];
    }
  };

  const displayPlans = plans.length
    ? plans
        .filter((p) => (p.id || '').toLowerCase() !== 'unlimited')
        .map((p) => {
          const id = (p.id || p._id || '').toLowerCase();
          const name = p.name || (id === 'starter' ? 'Starter' : id === 'value' ? 'Value for Money' : id);
          const isStarter = id === 'starter' || name === 'Starter';
          const forcedTagline = isStarter ? 'Try 2 voice interviews' : planTaglines[name] || (p.description || "");
          const forcedFeatures = isStarter
            ? [
                '2 interviews (25 mins each)',
                'Basic feedback report',
                'Role-based questions',
              ]
            : featuresForPlan(name).length
              ? featuresForPlan(name)
              : [
                  p.description || 'Plan benefits',
                  `${p.creditsGranted} interview credits`,
                ];

          return {
            id: p.id,
            name,
            priceInRupees: isStarter ? 50 : p.priceInRupees,
            tagline: forcedTagline,
            features: forcedFeatures,
            highlighted: !!p.highlighted,
          };
        })
    : defaultPlans;

  return (
    <div className="pr-page">
      <div className="about-background">
        <div className="about-bg-element about-bg-1"></div>
        <div className="about-bg-element about-bg-2"></div>
        <div className="about-bg-element about-bg-3"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="pr-container">

        <div className="pr-header">
          <div className="pr-badge">New • Unlock full access</div>
          <h1 className="pr-title">Simple pricing for everyone</h1>
          <p className="pr-subtitle">Upgrade to get additional interview credits and analytics.</p>
        </div>

        <div className="pr-shell">
          <div className="pr-shell-popular">
            {/* <span className="pr-popular-badge"><Star className="pr-icon pr-icon--xs" /> Most Popular</span> */}
          </div>

          <div className="pr-grid">
          {plans.length === 0 && displayPlans.length === 0 && <div>Loading plans...</div>}
          {displayPlans.map((plan, index) => (
            <div key={plan.id} className="pr-card-wrap">
              <div className={`pr-card ${plan.highlighted ? 'pr-card--popular' : ''}`}>
                <div className="pr-card-glow" />
                <div className="pr-card-header">
                  <div className="pr-card-title-row">
                    <h3 className="pr-card-title">{plan.name}</h3>
                    {plan.highlighted && <Star className="pr-icon pr-icon--sm pr-star" />}
                  </div>
                  <div className="pr-card-price">₹{plan.priceInRupees}</div>
                  {plan.tagline && <div className="pr-card-tagline">{plan.tagline}</div>}
                </div>

                <ul className="pr-card-features">
                  {plan.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>

                <div className="pr-card-actions">
                  <button
                    disabled={loading || (!plans.length && !token)}
                    onClick={() => buyPlan(plan.id)}
                    className="pr-cta"
                  >
                    {loading ? 'Processing...' : plan.id === 'starter' ? 'Start Free Interview' : 'Buy'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Pricing;

