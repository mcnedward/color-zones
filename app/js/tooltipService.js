function TooltipService(tooltips) {
  var self = this;

  const storageKey = 'tooltipsShown';

  self.loadToolips = function() {
    var tooltipsShown = localStorage.getItem(storageKey);
    if (tooltips.length == 0 || tooltipsShown) return;
    showTooltip(0)
  }

  function showTooltip(index) {
    if (index === tooltips.length) return;
    try {
      tooltips[index].id.tooltip('show');
    } catch(e) {}

    setTimeout(function() {
      try {
        tooltips[index].id.tooltip('dispose');
      } catch(e) {}
      // Increment the index to try to get the next tooltip
      index++;
      if (!tooltips[index]) {
        // Don't show the tooltips again
        localStorage.setItem(storageKey, true);
      };
      showTooltip(index);
    }, tooltips[index].timeout * 1000);
  }

}