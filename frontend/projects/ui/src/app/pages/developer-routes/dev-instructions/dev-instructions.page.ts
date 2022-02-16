import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { take } from 'rxjs/operators'
import { ApiService } from 'src/app/services/api/embassy-api.service'
import { ErrorToastService } from 'src/app/services/error-toast.service'
import { PatchDbService } from 'src/app/services/patch-db/patch-db.service'
import { debounce } from '../../../../../../shared/src/util/misc.util'
import { MarkdownPage } from '../../../modals/markdown/markdown.page'

@Component({
  selector: 'dev-instructions',
  templateUrl: 'dev-instructions.page.html',
  styleUrls: ['dev-instructions.page.scss'],
})
export class DevInstructionsPage {
  projectId: string
  editorOptions = { theme: 'vs-dark', language: 'markdown' }
  code: string
  saving: boolean = false

  constructor(
    private readonly route: ActivatedRoute,
    private readonly errToast: ErrorToastService,
    private readonly modalCtrl: ModalController,
    private readonly patchDb: PatchDbService,
    private readonly api: ApiService,
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId')

    this.patchDb
      .watch$('ui', 'dev', this.projectId, 'instructions')
      .pipe(take(1))
      .subscribe(config => {
        this.code = config
      })
  }

  async preview() {
    const modal = await this.modalCtrl.create({
      componentProps: {
        title: 'Instructions Sample',
        content: this.code,
      },
      component: MarkdownPage,
    })

    await modal.present()
  }

  @debounce(1000)
  async save() {
    this.saving = true
    try {
      await this.api.setDbValue({
        pointer: `/dev/${this.projectId}/instructions`,
        value: this.code,
      })
    } catch (e) {
      this.errToast.present({
        message: 'Auto save error:  Your changes are not saved.',
      } as any)
    } finally {
      this.saving = false
    }
  }
}
