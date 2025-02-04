import { ErrorHandler, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { HttpClientModule } from '@angular/common/http'
import { ApiService } from './services/api/api.service'
import { MockApiService } from './services/api/mock-api.service'
import { LiveApiService } from './services/api/live-api.service'
import { HttpService } from './services/api/http.service'
import {
  IonicModule,
  IonicRouteStrategy,
  iosTransitionAnimation,
} from '@ionic/angular'
import { AppComponent } from './app.component'
import { AppRoutingModule } from './app-routing.module'
import { GlobalErrorHandler } from './services/global-error-handler.service'
import { SuccessPageModule } from './pages/success/success.module'
import { HomePageModule } from './pages/home/home.module'
import { LoadingPageModule } from './pages/loading/loading.module'
import { ProdKeyModalModule } from './modals/prod-key-modal/prod-key-modal.module'
import { ProductKeyPageModule } from './pages/product-key/product-key.module'
import { RecoverPageModule } from './pages/recover/recover.module'
import { WorkspaceConfig } from '@start9labs/shared'

const { useMocks } = require('../../../../config.json') as WorkspaceConfig

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'md',
      navAnimation: iosTransitionAnimation,
    }),
    AppRoutingModule,
    HttpClientModule,
    SuccessPageModule,
    HomePageModule,
    LoadingPageModule,
    ProdKeyModalModule,
    ProductKeyPageModule,
    RecoverPageModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: ApiService,
      useFactory: (http: HttpService) => {
        if (useMocks) {
          return new MockApiService()
        } else {
          return new LiveApiService(http)
        }
      },
      deps: [HttpService],
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
