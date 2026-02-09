import React from 'react'
import { Navigate } from 'react-router-dom'
import Dashboard from './page/Dashboard'
import TablePage from './page/TablePage'
import ProTablePage from './page/ProTablePage'

const routes = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/table',
    element: <TablePage />,
  },
  {
    path: '/pro-table',
    element: <ProTablePage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]

export default routes