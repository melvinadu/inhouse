// Put your application javascript here
$(document).ready(function() {

    //Currency Global Variables

    let 
        moneySpanSelecter = 'span.money',
        currencyPickerSelector = '[name=currencies]',
        activeCurrencySelector = '.js-active-currency',
        currencyNoteSelector = '.js-cart-currency-note';

    let currencyPicker = {
     loadCurrency: function() {
        /* Fix for customer account pages */
        $(moneySpanSelecter + ' ' + moneySpanSelecter).each(function() {
            $(this).parents(moneySpanSelecter).removeClass('money');
        });

        /* Saving the current price */
        $(moneySpanSelecter).each(function() {
            $(this).attr('data-currency-'+shopCurrency, $(this).html());
        });

        // If there's no cookie.
        if (cookieCurrency == null) {
            if (shopCurrency !== defaultCurrency) {
            Currency.convertAll(shopCurrency, defaultCurrency);
            }
            else {
            Currency.currentCurrency = defaultCurrency;
            }
        }
        // If the cookie value does not correspond to any value in the currency dropdown.
        else if ($(currencyPickerSelector).length && $(currencyPickerSelector + ' option[value=' + cookieCurrency + ']').length === 0) {
            Currency.currentCurrency = shopCurrency;
            Currency.cookie.write(shopCurrency);
        }
        else if (cookieCurrency === shopCurrency) {
            Currency.currentCurrency = shopCurrency;
        }
        else {
            $(currencyPickerSelector).val(cookieCurrency);
            Currency.convertAll(shopCurrency, cookieCurrency);
        }

        currencyPicker.setCurrencyText();
     },

     onCurrencyChanged: function(event) {
        let 
            newCurrency = $(this).val();
            $otherPickers = $(currencyPickerSelector).not($(this));
        Currency.convertAll(Currency.currentCurrency, newCurrency);

        currencyPicker.setCurrencyText(newCurrency);

        if ($otherPickers.length > 0) {
            $otherPickers.val(newCurrency);
        }
     },

     setCurrencyText: function(newCurrency = Currency.currentCurrency) {
        let
            $activeCurrency = $(activeCurrencySelector),
            $currencyNote = $(currencyNoteSelector);

        if ($activeCurrency.length > 0) {
            $activeCurrency.text(newCurrency);
        }

        if ($currencyNote.length > 0) {
            if (newCurrency !== shopCurrency) {
                $currencyNote.show();
            } else {
                $currencyNote.hide();
            }
        }
     },

     onMoneySpanAdded: function() {
        Currency.convertAll(shopCurrency, Currency.currentCurrency);
        currencyPicker.setCurrencyText();
     },

     init: function() {
        if (showMultipleCurrencies !== true) {
            return false;
        }

        currencyPicker.loadCurrency();

        $(document).on('change', currencyPickerSelector, currencyPicker.onCurrencyChanged);
     }
    }

currencyPicker.init();

  var original_selectCallback = window.selectCallback;
  var selectCallback = function(variant, selector) {
    original_selectCallback(variant, selector);
    Currency.convertAll(shopCurrency, $('[name=currencies]').val());
    $('.selected-currency').text(Currency.currentCurrency);
  };

  $('body').on('ajaxCart.afterCartLoad', function(cart) {
    Currency.convertAll(shopCurrency, $('[name=currencies]').val());
    $('.selected-currency').text(Currency.currentCurrency);  
  });

  $('.selected-currency').text(Currency.currentCurrency);

});


