import { Inject, Injectable } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Observable, of } from 'rxjs'
import { filter, share, switchMap, take, tap } from 'rxjs/operators'
import { isEmptyObject } from '@start9labs/shared'

import { PatchDbService } from 'src/app/services/patch-db/patch-db.service'
import { DataModel, UIData } from 'src/app/services/patch-db/data-model'
import { EOSService } from 'src/app/services/eos.service'
import { OSWelcomePage } from 'src/app/modals/os-welcome/os-welcome.page'
import { ConfigService } from 'src/app/services/config.service'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { PatchMonitorService } from './patch-monitor.service'
import { MarketplaceService } from 'src/app/services/marketplace.service'
import { AbstractMarketplaceService } from '../../../../../../marketplace/src/services/marketplace.service'

// Get data from PatchDb after is starts and act upon it
@Injectable({
  providedIn: 'root',
})
export class PatchDataService extends Observable<DataModel | null> {
  private readonly stream$ = this.patchMonitor.pipe(
    switchMap(started =>
      started
        ? this.patch.watch$().pipe(
            filter(obj => !isEmptyObject(obj)),
            take(1),
            tap(({ ui }) => {
              // check for updates to EOS and services
              this.checkForUpdates(ui)
              // show eos welcome message
              this.showEosWelcome(ui['ack-welcome'])
            }),
          )
        : of(null),
    ),
    share(),
  )

  constructor(
    private readonly patchMonitor: PatchMonitorService,
    private readonly patch: PatchDbService,
    private readonly eosService: EOSService,
    private readonly config: ConfigService,
    private readonly modalCtrl: ModalController,
    private readonly embassyApi: ApiService,
    @Inject(AbstractMarketplaceService)
    private readonly marketplaceService: MarketplaceService,
  ) {
    super(subscriber => this.stream$.subscribe(subscriber))
  }

  private checkForUpdates(ui: UIData): void {
    if (ui['auto-check-updates'] !== false) {
      this.eosService.getEOS()
      this.marketplaceService.getPackages().pipe(take(1)).subscribe()
      this.marketplaceService.getCategories().pipe(take(1)).subscribe()
    }
  }

  private async showEosWelcome(ackVersion: string): Promise<void> {
    if (this.config.skipStartupAlerts || ackVersion === this.config.version) {
      return
    }

    const modal = await this.modalCtrl.create({
      component: OSWelcomePage,
      presentingElement: await this.modalCtrl.getTop(),
      backdropDismiss: false,
      componentProps: {
        version: this.config.version,
      },
    })
    modal.onWillDismiss().then(() => {
      this.embassyApi
        .setDbValue({ pointer: '/ack-welcome', value: this.config.version })
        .catch()
    })

    await modal.present()
  }
}
