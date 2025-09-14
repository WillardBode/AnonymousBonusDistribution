import { useWeb3 } from './hooks/useWeb3';
import { Layout } from './components/Layout';
import { WalletConnection } from './components/WalletConnection';
import { ManagerSection } from './components/ManagerSection';
import { EmployeeSection } from './components/EmployeeSection';

function App() {
  const walletState = useWeb3();

  return (
    <Layout state={walletState}>
      {!walletState.userAccount ? (
        <WalletConnection 
          connectWallet={walletState.connectWallet}
          isLoading={walletState.isLoading}
        />
      ) : (
        <>
          <ManagerSection
            state={walletState}
            updateContractInfo={walletState.updateContractInfo}
            setMessage={walletState.setMessage}
            setLoading={walletState.setLoading}
          />
          <EmployeeSection
            state={walletState}
            updateContractInfo={walletState.updateContractInfo}
            setMessage={walletState.setMessage}
            setLoading={walletState.setLoading}
          />
        </>
      )}
    </Layout>
  );
}

export default App;