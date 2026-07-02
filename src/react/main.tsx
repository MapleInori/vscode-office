import './polyfills/buffer';
import ReactDOM from 'react-dom/client';
import './util/vscode.js';
import { getConfigs } from './util/vscodeConfig.ts';
import { initI18n, $t } from './i18n/i18nConfig.ts';
import './main.css';
import { ConfigProvider } from 'antd';
import { lazy } from 'react';
import { antThemeConfig } from './antThemeConfig.ts';
const Excel = lazy(() => import('./view/excel/Excel.tsx'));

document.getElementById('_defaultStyles')?.parentNode?.removeChild(document.getElementById('_defaultStyles'));
const configs = getConfigs();
initI18n(configs?.language);
ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider
    componentSize='small'
    theme={antThemeConfig}
  >
    {(() => {
      const route = configs?.route;
      switch (route) {
        case 'excel':
          return <Excel />;
        default:
          return <>{$t('common.officeViewer')}</>;
      }
    })()}
  </ConfigProvider>
);