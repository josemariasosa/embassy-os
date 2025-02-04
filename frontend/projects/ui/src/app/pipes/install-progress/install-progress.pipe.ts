import { Pipe, PipeTransform } from '@angular/core'
import { InstallProgress } from 'src/app/services/patch-db/data-model'
import { packageLoadingProgress } from 'src/app/util/package-loading-progress'

@Pipe({
  name: 'installProgressDisplay',
})
export class InstallProgressPipe implements PipeTransform {
  transform(installProgress?: InstallProgress): string {
    const totalProgress = packageLoadingProgress(installProgress)?.totalProgress || 0

    return totalProgress < 99 ? totalProgress + '%' : 'finalizing'
  }
}
