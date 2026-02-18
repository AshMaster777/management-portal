import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminGate } from './components/AdminGate';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';
import { Categories } from './pages/Categories';
import { Tags } from './pages/Tags';
import { Sales } from './pages/Sales';
import { ProductForm } from './pages/ProductForm';
import { ComingSoon } from './components/common/ComingSoon';
import { Faqs } from './pages/Faqs';
import { Downloads } from './pages/Downloads';
import { AccountDetails } from './pages/AccountDetails';
import { Credits } from './pages/Credits';
import { Staff } from './pages/Staff';
import { Partners } from './pages/Partners';
import { Partnerships } from './pages/Partnerships';

function App() {
  return (
    <Router basename="/admin">
      <AdminGate>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="sales" element={<Sales />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tags" element={<Tags />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="licenses" element={<ComingSoon />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="credits" element={<Credits />} />
          <Route path="partners" element={<Partners />} />
          <Route path="partnerships" element={<Partnerships />} />
          <Route path="staff" element={<Staff />} />
          <Route path="account" element={<AccountDetails />} />
          <Route path="*" element={<div className="p-8">Not Found</div>} />
        </Route>
      </Routes>
      </AdminGate>
    </Router>
  );
}

export default App;
