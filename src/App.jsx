import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import { createBrowserRouter } from 'react-router-dom'
import routes from './routes'

const router = createBrowserRouter(routes)

const App = () => {
  return (
    <ConfigProvider>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
