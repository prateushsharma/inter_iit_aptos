import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const Navbar = () => {
  const { account } = useWallet();
  const address = account?.address;

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
          {/* First ul for navigation links */}
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link btn btn-light" to="/app2">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link btn btn-light" to="/upload">Upload</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link btn btn-light" to="/earnings">Earnings</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link btn btn-light" to="/trending">Trendings</Link>
            </li>
          </ul>
          
          {/* Second ul for address and future buttons, aligned to the right */}
          <ul className="navbar-nav ms-auto ">
            <li className="nav-item">
              <div className="nav-link btn btn-light">
                {address?.substring(0,20)}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
