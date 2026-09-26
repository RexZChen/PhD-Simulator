import { t } from '../i18n/index.js';
import { esc, btn } from './helpers.js';
import { dateLabel } from '../data/calendar.js';

export function backupError(code) {
  switch (code) {
    case 'too-large': return t('This backup is too large. Choose a file smaller than 5 MB.');
    case 'version': return t('This backup belongs to an unsupported version of the game. Your current saves are unchanged.');
    case 'read': return t('The current saves could not be read. Nothing was replaced.');
    case 'write': return t('The backup could not be restored because save storage is unavailable or full. Your current saves are unchanged.');
    default: return t('This file is not a valid Academic OS backup. Your current saves are unchanged.');
  }
}

export function backupControls(recoveryCount = 0) {
  return `<section class="backup-controls"><h3>${t(recoveryCount ? 'Preserved saves' : 'Keep a copy')}</h3>${recoveryCount ? `<p><b>${t('Preserved originals: {n}', { n: recoveryCount })}</b></p><p>${t('This build cannot resume these saves. Download an original below to keep its exact contents.')}</p><p>${t('Original files are recovery data, not restorable backups for this build. Keep them for a compatible build or support.')}</p><div class="row">${Array.from({ length: recoveryCount }, (_, index) => btn(t('Download original {n}', { n: index + 1 }), 'recovery-export', { id: index })).join('')}</div>` : `<p class="small">${t('Download your current run, all slots, achievements and settings in one file. Keep it somewhere safe or move it to another computer.')}</p>`}<div class="row">${btn(t('Download backup'), 'backup-export')}${btn(t('Choose backup file…'), 'backup-choose')}</div><input id="backup-file" type="file" accept=".json,application/json" hidden></section>`;
}

export function backupPreview(preview, currentRecoveryCount = 0) {
  const summary = preview.summary;
  const runLine = run => run ? `${esc(run.name)} · ${esc(dateLabel(run.month))}${run.program ? ` · ${esc(run.program)}` : ''}` : t('Empty');
  return `<section class="backup-preview"><h2>${t('Restore this backup?')}</h2><p class="backup-filename">${esc(preview.name)}</p><dl><dt>${t('This machine (autosaves)')}</dt><dd>${runLine(summary.autosave)}</dd>${summary.slots.map(slot => `<dt>${t('Slot {n}', { n: slot.id })}</dt><dd>${runLine(slot.summary)}</dd>`).join('')}<dt>${t('Achievements')}</dt><dd>${summary.achievements}</dd></dl>
  <p>${t('Preserved originals in this backup: {n}', { n: summary.recoveryCount || 0 })}</p>
  <p>${t('Restoring replaces the current run, all saved slots, achievements and settings in this game. Download a copy first if you want to keep them.')}</p>
  ${currentRecoveryCount ? `<p class="note-line">${t('It also replaces the {n} preserved originals on this device. Download the current backup to keep them.', { n: currentRecoveryCount })}</p>` : ''}
  <div class="row">${btn(t('Download current backup'), 'backup-export')}${btn(t('Cancel'), 'backup-cancel')}${btn(t('Replace saves and reload'), 'backup-restore', { cls: 'danger' })}</div></section>`;
}
