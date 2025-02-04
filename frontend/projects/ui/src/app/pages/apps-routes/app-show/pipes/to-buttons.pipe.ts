import { Inject, Pipe, PipeTransform } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DOCUMENT } from '@angular/common'
import { AlertController, ModalController, NavController } from '@ionic/angular'
import {
  isValidHttpUrl,
  MarkdownComponent,
  removeTrailingSlash,
} from '@start9labs/shared'
import {
  PackageDataEntry,
  UIMarketplaceData,
} from 'src/app/services/patch-db/data-model'
import { ModalService } from 'src/app/services/modal.service'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { from } from 'rxjs'
import { Marketplace } from '@start9labs/marketplace'
import { ActionMarketplaceComponent } from 'src/app/modals/action-marketplace/action-marketplace.component'
export interface Button {
  title: string
  description: string
  icon: string
  action: Function
  disabled?: boolean
}

@Pipe({
  name: 'toButtons',
})
export class ToButtonsPipe implements PipeTransform {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly alertCtrl: AlertController,
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly modalCtrl: ModalController,
    private readonly modalService: ModalService,
    private readonly apiService: ApiService,
  ) {}

  transform(
    pkg: PackageDataEntry,
    currentMarketplace: Marketplace | null,
    altMarketplaces: UIMarketplaceData | null | undefined,
  ): Button[] {
    const pkgTitle = pkg.manifest.title

    return [
      // instructions
      {
        action: () => this.presentModalInstructions(pkg),
        title: 'Instructions',
        description: `Understand how to use ${pkgTitle}`,
        icon: 'list-outline',
      },
      // config
      {
        action: async () =>
          this.modalService.presentModalConfig({ pkgId: pkg.manifest.id }),
        title: 'Config',
        description: `Customize ${pkgTitle}`,
        icon: 'construct-outline',
      },
      // properties
      {
        action: () =>
          this.navCtrl.navigateForward(['properties'], {
            relativeTo: this.route,
          }),
        title: 'Properties',
        description:
          'Runtime information, credentials, and other values of interest',
        icon: 'briefcase-outline',
      },
      // actions
      {
        action: () =>
          this.navCtrl.navigateForward(['actions'], { relativeTo: this.route }),
        title: 'Actions',
        description: `Uninstall and other commands specific to ${pkgTitle}`,
        icon: 'flash-outline',
      },
      // interfaces
      {
        action: () =>
          this.navCtrl.navigateForward(['interfaces'], {
            relativeTo: this.route,
          }),
        title: 'Interfaces',
        description: 'User and machine access points',
        icon: 'desktop-outline',
      },
      // logs
      {
        action: () =>
          this.navCtrl.navigateForward(['logs'], { relativeTo: this.route }),
        title: 'Logs',
        description: 'Raw, unfiltered service logs',
        icon: 'receipt-outline',
      },
      // view in marketplace
      this.viewInMarketplaceButton(pkg, currentMarketplace, altMarketplaces),
      // donate
      {
        action: () => this.donate(pkg),
        title: 'Donate',
        description: `Support ${pkgTitle}`,
        icon: 'logo-bitcoin',
      },
    ]
  }

  private async presentModalInstructions(pkg: PackageDataEntry) {
    const modal = await this.modalCtrl.create({
      componentProps: {
        title: 'Instructions',
        content: from(
          this.apiService.getStatic(pkg['static-files']['instructions']),
        ),
      },
      component: MarkdownComponent,
    })

    await modal.present()
  }

  private viewInMarketplaceButton(
    pkg: PackageDataEntry,
    currentMarketplace: Marketplace | null,
    altMarketplaces: UIMarketplaceData | null | undefined,
  ): Button {
    const pkgMarketplace = pkg.installed?.['marketplace-url']
    // default button if package marketplace and current marketplace are the same
    let button: Button = {
      title: 'Marketplace',
      icon: 'storefront-outline',
      action: () =>
        this.navCtrl.navigateForward([`marketplace/${pkg.manifest.id}`]),
      disabled: false,
      description: 'View service in marketplace',
    }
    if (!pkgMarketplace) {
      button.disabled = true
      button.description = 'This package was not installed from a marketplace.'
      button.action = () => {}
    } else if (
      pkgMarketplace &&
      currentMarketplace &&
      removeTrailingSlash(pkgMarketplace) !==
        removeTrailingSlash(currentMarketplace.url)
    ) {
      // attempt to get name for pkg marketplace
      let pkgTitle = removeTrailingSlash(pkgMarketplace)
      if (altMarketplaces) {
        const nameOptions = Object.values(
          altMarketplaces['known-hosts'],
        ).filter(m => m.url === pkgTitle)
        if (nameOptions.length) {
          // if multiple of the same url exist, they will have the same name, so fine to grab first
          pkgTitle = nameOptions[0].name
        }
      }
      let marketplaceTitle = removeTrailingSlash(currentMarketplace.url)
      // if we found a name for the pkg marketplace, use the name of the currently connected marketplace
      if (!isValidHttpUrl(pkgTitle)) {
        marketplaceTitle = currentMarketplace.name
      }

      button.action = () =>
        this.differentMarketplaceAction(
          pkgTitle,
          marketplaceTitle,
          pkg.manifest.id,
        )
      button.description = 'Service was installed from a different marketplace'
    }
    return button
  }

  private async donate({ manifest }: PackageDataEntry): Promise<void> {
    const url = manifest['donation-url']
    if (url) {
      this.document.defaultView?.open(url, '_blank', 'noreferrer')
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Not Accepting Donations',
        message: `The developers of ${manifest.title} have not provided a donation URL. Please contact them directly if you insist on giving them money.`,
      })
      await alert.present()
    }
  }

  private async differentMarketplaceAction(
    packageMarketplace: string,
    currentMarketplace: string,
    pkgId: string,
  ) {
    const modal = await this.modalCtrl.create({
      component: ActionMarketplaceComponent,
      componentProps: {
        title: 'Marketplace Conflict',
        packageMarketplace,
        currentMarketplace,
        pkgId,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ],
      },
      cssClass: 'medium-modal',
    })
    await modal.present()
  }
}
