import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { NavController } from '@ionic/angular'
import { PatchDbService } from 'src/app/services/patch-db/patch-db.service'
import {
  PackageDataEntry,
  PackageMainStatus,
  PackageState,
  UIMarketplaceData,
} from 'src/app/services/patch-db/data-model'
import {
  PackageStatus,
  PrimaryStatus,
} from 'src/app/services/pkg-status-rendering.service'
import { map, startWith, filter } from 'rxjs/operators'
import { ActivatedRoute } from '@angular/router'
import { getPkgId } from '@start9labs/shared'
import { MarketplaceService } from 'src/app/services/marketplace.service'
import {
  AbstractMarketplaceService,
  Marketplace,
} from '@start9labs/marketplace'
import { Observable } from 'rxjs'

const STATES = [
  PackageState.Installing,
  PackageState.Updating,
  PackageState.Restoring,
]

@Component({
  selector: 'app-show',
  templateUrl: './app-show.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShowPage {
  private readonly pkgId = getPkgId(this.route)

  readonly pkg$ = this.patch.watch$('package-data', this.pkgId).pipe(
    map(pkg => {
      // if package disappears, navigate to list page
      if (!pkg) {
        this.navCtrl.navigateRoot('/services')
      }

      return { ...pkg }
    }),
    startWith(this.patch.getData()['package-data'][this.pkgId]),
    filter(
      (p: PackageDataEntry | undefined) =>
        // will be undefined when sideloading
        p !== undefined &&
        !(
          p.installed?.status.main.status === PackageMainStatus.Starting &&
          p.installed?.status.main.restarting
        ),
    ),
  )

  readonly currentMarketplace$: Observable<Marketplace> =
    this.marketplaceService.getMarketplace()

  readonly altMarketplaceData$: Observable<UIMarketplaceData | undefined> =
    this.marketplaceService.getAltMarketplace()

  constructor(
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly patch: PatchDbService,
    @Inject(AbstractMarketplaceService)
    private readonly marketplaceService: MarketplaceService,
  ) {}

  isInstalled({ state }: PackageDataEntry): boolean {
    return state === PackageState.Installed
  }

  isRunning({ primary }: PackageStatus): boolean {
    return primary === PrimaryStatus.Running
  }

  isBackingUp({ primary }: PackageStatus): boolean {
    return primary === PrimaryStatus.BackingUp
  }

  showProgress({ state }: PackageDataEntry): boolean {
    return STATES.includes(state)
  }
}
