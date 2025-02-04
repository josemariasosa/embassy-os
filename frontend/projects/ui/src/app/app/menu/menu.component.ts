import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { ConfigService } from '../../services/config.service'
import { LocalStorageService } from '../../services/local-storage.service'
import { EOSService } from '../../services/eos.service'
import { ApiService } from '../../services/api/embassy-api.service'
import { AuthService } from '../../services/auth.service'
import { PatchDbService } from '../../services/patch-db/patch-db.service'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { AbstractMarketplaceService } from '@start9labs/marketplace'
import { MarketplaceService } from 'src/app/services/marketplace.service'

@Component({
  selector: 'app-menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  readonly pages = [
    {
      title: 'Services',
      url: '/services',
      icon: 'grid-outline',
    },
    {
      title: 'Embassy',
      url: '/embassy',
      icon: 'cube-outline',
    },
    {
      title: 'Marketplace',
      url: '/marketplace',
      icon: 'storefront-outline',
    },
    {
      title: 'Notifications',
      url: '/notifications',
      icon: 'notifications-outline',
    },
    {
      title: 'Developer Tools',
      url: '/developer',
      icon: 'hammer-outline',
    },
  ]

  readonly notificationCount$ = this.patch.watch$(
    'server-info',
    'unread-notification-count',
  )

  readonly showEOSUpdate$ = this.eosService.showUpdate$

  readonly showDevTools$ = this.localStorageService.showDevTools$

  readonly updateCount$: Observable<number> = this.marketplaceService
    .getUpdates()
    .pipe(map(pkgs => pkgs.length))

  constructor(
    private readonly config: ConfigService,
    private readonly alertCtrl: AlertController,
    private readonly embassyApi: ApiService,
    private readonly authService: AuthService,
    private readonly patch: PatchDbService,
    private readonly localStorageService: LocalStorageService,
    private readonly eosService: EOSService,
    @Inject(AbstractMarketplaceService)
    private readonly marketplaceService: MarketplaceService,
  ) {}

  get href(): string {
    return this.config.isTor()
      ? 'http://privacy34kn4ez3y3nijweec6w4g54i3g54sdv7r5mr6soma3w4begyd.onion'
      : 'https://start9.com'
  }

  async presentAlertLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message:
        'Do you know your password? If you log out and forget your password, you may permanently lose access to your Embassy.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Logout',
          handler: () => this.logout(),
          cssClass: 'enter-click',
        },
      ],
    })

    await alert.present()
  }

  // should wipe cache independent of actual BE logout
  private logout() {
    this.embassyApi.logout({})
    this.authService.setUnverified()
  }
}
