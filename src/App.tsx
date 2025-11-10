import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { MemberDetailPage } from './components/MemberDetailPage';
import { PaymentPage } from './components/PaymentPage';
import { useSubscription } from './hooks/useSubscription';
import { LogOut, Loader2 } from 'lucide-react';

type Screen = 'home' | 'detail';

const STRIPE_PRICE_ID = 'price_1SS1fuBmLTTtwrnc0NR5YnSJ';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { isActive: hasSubscription, isLoading: subscriptionLoading } = useSubscription(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    setCurrentScreen('detail');
  };

  const handleBack = () => {
    setSelectedMemberId(null);
    setCurrentScreen('home');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('home');
    setSelectedMemberId(null);
  };

  if (isAuthenticated === null || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!hasSubscription) {
    return <PaymentPage priceId={STRIPE_PRICE_ID} />;
  }

  return (
    <>
      <button
        onClick={handleSignOut}
        className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
      {currentScreen === 'home' && (
        <HomePage onMemberSelect={handleMemberSelect} />
      )}
      {currentScreen === 'detail' && selectedMemberId && (
        <MemberDetailPage memberId={selectedMemberId} onBack={handleBack} />
      )}
    </>
  );
}

export default App;
