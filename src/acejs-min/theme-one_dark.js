ace.define('ace/theme/one_dark', ['require', 'exports', 'module', 'ace/lib/dom'], function (e, t, n) {
  ;(t.isDark = !0), (t.cssClass = 'ace-one-dark')
  t.cssText =
    '.ace-one-dark .ace_gutter{background:#282c34;color:#6a6f7a}.ace-one-dark .ace_print-margin{width:1px;background:#e8e8e8}.ace-one-dark{background-color:#282c34;color:#abb2bf}.ace-one-dark .ace_cursor{color:#528bff}.ace-one-dark .ace_marker-layer .ace_selection{background:#3d4350}.ace-one-dark.ace_multiselect .ace_selection.ace_start{box-shadow:0 0 3px 0 #282c34;border-radius:2px}.ace-one-dark .ace_marker-layer .ace_step{background:#c6dbae}.ace-one-dark .ace_marker-layer .ace_bracket{margin:-1px 0 0 -1px;border:1px solid #747369}.ace-one-dark .ace_marker-layer .ace_active-line{background:rgba(76,87,103,.19)}.ace-one-dark .ace_gutter-active-line{background-color:rgba(76,87,103,.19)}.ace-one-dark .ace_marker-layer .ace_selected-word{border:1px solid #3d4350}.ace-one-dark .ace_fold{background-color:#61afef;border-color:#abb2bf}.ace-one-dark .ace_keyword{color:#c678dd}.ace-one-dark .ace_keyword.ace_operator{color:#abb2bf}.ace-one-dark .ace_keyword.ace_other.ace_unit{color:#d19a66}.ace-one-dark .ace_constant{color:#d19a66}.ace-one-dark .ace_constant.ace_numeric{color:#d19a66}.ace-one-dark .ace_constant.ace_character.ace_escape{color:#56b6c2}.ace-one-dark .ace_support.ace_function{color:#56b6c2}.ace-one-dark .ace_support.ace_class{color:#e5c07b}.ace-one-dark .ace_storage{color:#c678dd}.ace-one-dark .ace_invalid.ace_illegal{color:#fff;background-color:#f2777a}.ace-one-dark .ace_invalid.ace_deprecated{color:#272b33;background-color:#d27b53}.ace-one-dark .ace_string{color:#98c379}.ace-one-dark .ace_string.ace_regexp{color:#56b6c2}.ace-one-dark .ace_comment{font-style:italic;color:#5c6370}.ace-one-dark .ace_variable{color:#e06c75}.ace-one-dark .ace_meta.ace_selector{color:#c678dd}.ace-one-dark .ace_entity.ace_other.ace_attribute-name{color:#d19a66}.ace-one-dark .ace_entity.ace_name.ace_function{color:#61afef}.ace-one-dark .ace_entity.ace_name.ace_tag{color:#e06c75}.ace-one-dark .ace_markup.ace_list{color:#e06c75}'
  var r = e('../lib/dom')
  r.importCssString(t.cssText, t.cssClass)
})
;(function () {
  ace.require(['ace/theme/one_dark'], function (m) {
    if (typeof module == 'object' && typeof exports == 'object' && module) {
      module.exports = m
    }
  })
})()
