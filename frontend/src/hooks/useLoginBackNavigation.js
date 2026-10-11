import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useLoginBackNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const returnToLanding = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', returnToLanding);
    return () => window.removeEventListener('popstate', returnToLanding);
  }, [navigate]);
};

export default useLoginBackNavigation;
