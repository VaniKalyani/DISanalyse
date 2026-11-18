import React from 'react'

// Material Symbols (Rounded) — https://m3.material.io/styles/icons/overview
// Icons are bundled as inline SVG from @material-symbols/svg-400, so they render
// instantly, need no web-font download and inherit `currentColor`.
import i_account_circle from '@material-symbols/svg-400/rounded/account_circle.svg?raw'
import i_add from '@material-symbols/svg-400/rounded/add.svg?raw'
import i_arrow_forward from '@material-symbols/svg-400/rounded/arrow_forward.svg?raw'
import i_build from '@material-symbols/svg-400/rounded/build.svg?raw'
import i_check from '@material-symbols/svg-400/rounded/check.svg?raw'
import i_chevron_left from '@material-symbols/svg-400/rounded/chevron_left.svg?raw'
import i_chevron_right from '@material-symbols/svg-400/rounded/chevron_right.svg?raw'
import i_close from '@material-symbols/svg-400/rounded/close.svg?raw'
import i_delete from '@material-symbols/svg-400/rounded/delete.svg?raw'
import i_description from '@material-symbols/svg-400/rounded/description.svg?raw'
import i_drag_indicator from '@material-symbols/svg-400/rounded/drag_indicator.svg?raw'
import i_edit from '@material-symbols/svg-400/rounded/edit.svg?raw'
import i_expand_less from '@material-symbols/svg-400/rounded/keyboard_arrow_up.svg?raw'
import i_expand_more from '@material-symbols/svg-400/rounded/keyboard_arrow_down.svg?raw'
import i_grid_view from '@material-symbols/svg-400/rounded/grid_view.svg?raw'
import i_help from '@material-symbols/svg-400/rounded/help.svg?raw'
import i_home from '@material-symbols/svg-400/rounded/home.svg?raw'
import i_info from '@material-symbols/svg-400/rounded/info.svg?raw'
import i_language from '@material-symbols/svg-400/rounded/language.svg?raw'
import i_mail from '@material-symbols/svg-400/rounded/mail.svg?raw'
import i_menu from '@material-symbols/svg-400/rounded/menu.svg?raw'
import i_monitoring from '@material-symbols/svg-400/rounded/monitoring.svg?raw'
import i_open_in_full from '@material-symbols/svg-400/rounded/open_in_full.svg?raw'
import i_payments from '@material-symbols/svg-400/rounded/payments.svg?raw'
import i_person from '@material-symbols/svg-400/rounded/person.svg?raw'
import i_save from '@material-symbols/svg-400/rounded/save.svg?raw'
import i_schedule from '@material-symbols/svg-400/rounded/schedule.svg?raw'
import i_settings from '@material-symbols/svg-400/rounded/settings.svg?raw'
import i_upload from '@material-symbols/svg-400/rounded/upload.svg?raw'
import i_warning from '@material-symbols/svg-400/rounded/warning.svg?raw'
import i_account_circle_fill from '@material-symbols/svg-400/rounded/account_circle-fill.svg?raw'
import i_add_fill from '@material-symbols/svg-400/rounded/add-fill.svg?raw'
import i_arrow_forward_fill from '@material-symbols/svg-400/rounded/arrow_forward-fill.svg?raw'
import i_build_fill from '@material-symbols/svg-400/rounded/build-fill.svg?raw'
import i_check_fill from '@material-symbols/svg-400/rounded/check-fill.svg?raw'
import i_chevron_left_fill from '@material-symbols/svg-400/rounded/chevron_left-fill.svg?raw'
import i_chevron_right_fill from '@material-symbols/svg-400/rounded/chevron_right-fill.svg?raw'
import i_close_fill from '@material-symbols/svg-400/rounded/close-fill.svg?raw'
import i_delete_fill from '@material-symbols/svg-400/rounded/delete-fill.svg?raw'
import i_description_fill from '@material-symbols/svg-400/rounded/description-fill.svg?raw'
import i_drag_indicator_fill from '@material-symbols/svg-400/rounded/drag_indicator-fill.svg?raw'
import i_edit_fill from '@material-symbols/svg-400/rounded/edit-fill.svg?raw'
import i_expand_less_fill from '@material-symbols/svg-400/rounded/keyboard_arrow_up-fill.svg?raw'
import i_expand_more_fill from '@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg?raw'
import i_grid_view_fill from '@material-symbols/svg-400/rounded/grid_view-fill.svg?raw'
import i_help_fill from '@material-symbols/svg-400/rounded/help-fill.svg?raw'
import i_home_fill from '@material-symbols/svg-400/rounded/home-fill.svg?raw'
import i_info_fill from '@material-symbols/svg-400/rounded/info-fill.svg?raw'
import i_language_fill from '@material-symbols/svg-400/rounded/language-fill.svg?raw'
import i_mail_fill from '@material-symbols/svg-400/rounded/mail-fill.svg?raw'
import i_menu_fill from '@material-symbols/svg-400/rounded/menu-fill.svg?raw'
import i_monitoring_fill from '@material-symbols/svg-400/rounded/monitoring-fill.svg?raw'
import i_open_in_full_fill from '@material-symbols/svg-400/rounded/open_in_full-fill.svg?raw'
import i_payments_fill from '@material-symbols/svg-400/rounded/payments-fill.svg?raw'
import i_person_fill from '@material-symbols/svg-400/rounded/person-fill.svg?raw'
import i_save_fill from '@material-symbols/svg-400/rounded/save-fill.svg?raw'
import i_schedule_fill from '@material-symbols/svg-400/rounded/schedule-fill.svg?raw'
import i_settings_fill from '@material-symbols/svg-400/rounded/settings-fill.svg?raw'
import i_upload_fill from '@material-symbols/svg-400/rounded/upload-fill.svg?raw'
import i_warning_fill from '@material-symbols/svg-400/rounded/warning-fill.svg?raw'

const ICONS = {
  account_circle: [i_account_circle, i_account_circle_fill],
  add: [i_add, i_add_fill],
  arrow_forward: [i_arrow_forward, i_arrow_forward_fill],
  build: [i_build, i_build_fill],
  check: [i_check, i_check_fill],
  chevron_left: [i_chevron_left, i_chevron_left_fill],
  chevron_right: [i_chevron_right, i_chevron_right_fill],
  close: [i_close, i_close_fill],
  delete: [i_delete, i_delete_fill],
  description: [i_description, i_description_fill],
  drag_indicator: [i_drag_indicator, i_drag_indicator_fill],
  edit: [i_edit, i_edit_fill],
  expand_less: [i_expand_less, i_expand_less_fill],
  expand_more: [i_expand_more, i_expand_more_fill],
  grid_view: [i_grid_view, i_grid_view_fill],
  help: [i_help, i_help_fill],
  home: [i_home, i_home_fill],
  info: [i_info, i_info_fill],
  language: [i_language, i_language_fill],
  mail: [i_mail, i_mail_fill],
  menu: [i_menu, i_menu_fill],
  monitoring: [i_monitoring, i_monitoring_fill],
  open_in_full: [i_open_in_full, i_open_in_full_fill],
  payments: [i_payments, i_payments_fill],
  person: [i_person, i_person_fill],
  save: [i_save, i_save_fill],
  schedule: [i_schedule, i_schedule_fill],
  settings: [i_settings, i_settings_fill],
  upload: [i_upload, i_upload_fill],
  warning: [i_warning, i_warning_fill],
}

const strip = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const BODIES = Object.fromEntries(
  Object.entries(ICONS).map(([k, [o, f]]) => [k, [strip(o), strip(f)]])
)

/**
 * <Icon name="chevron_right" size={16} />
 * Add new names by importing them above (see the Material Symbols catalogue for names).
 */
export default function Icon({ name, size = 18, fill = false, className = '', style, title, ...rest }) {
  const body = BODIES[name]
  if (!body) {
    if (import.meta.env.DEV) console.warn(`[Icon] unknown icon "${name}"`)
    return null
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      className={`icon ${className}`.trim()}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : '') + body[fill ? 1 : 0] }}
    />
  )
}
