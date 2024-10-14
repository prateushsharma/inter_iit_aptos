import React from 'react';
import { Link } from 'react-router-dom';
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
const wallets = [new PetraWallet()];
const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">On-chain Radio</a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDarkDropdown"
          aria-controls="navbarNavDarkDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavDarkDropdown">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              {/* Apply 'btn btn-light' classes to Home link */}
              <Link className="nav-link btn btn-light" to="/app2">Home</Link>
            </li>
           
            <li className="nav-item">
              {/* Apply 'btn btn-light' classes to Upload link */}
              <Link className="nav-link btn btn-light" to="/upload">upload</Link>
            </li>
            <li className="nav-item">
              {/* Apply 'btn btn-light' classes to Upload link */}
              <Link className="nav-link btn btn-light" to="/earnings">Earnings</Link>
            </li>
          </ul>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
