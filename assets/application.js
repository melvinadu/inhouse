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

//   var original_selectCallback = window.selectCallback;
//   var selectCallback = function(variant, selector) {
//     original_selectCallback(variant, selector);
//     Currency.convertAll(shopCurrency, $('[name=currencies]').val());
//     $('.selected-currency').text(Currency.currentCurrency);
//   };

//   $('body').on('ajaxCart.afterCartLoad', function(cart) {
//     Currency.convertAll(shopCurrency, $('[name=currencies]').val());
//     $('.selected-currency').text(Currency.currentCurrency);  
//   });

//   $('.selected-currency').text(Currency.currentCurrency);

    //Add to Cart Form

    let
        addToCartFormSelector = '#add-to-cart-form',
        productOptionSelector = addToCartFormSelector + ' [name*=option]';

    let productForm = {
        onProductOptionChanged: function(event) {
            let
                $form = $(this).closest(addToCartFormSelector),
                selectedVariant = productForm.getActiveVariant($form)

            $form.trigger('form:change', [selectedVariant])
        },
        getActiveVariant: function($form) {
            let
                variants = JSON.parse(decodeURIComponent($form.attr('data-variants')));
                formData = $form.serializeArray();
                formOptions = {
                    option1: null,
                    option2: null,
                    option3: null
                },
                selectedVariant = null
            
            $.each(formData, function(index, item) {
                if (item.name.indexOf('option') !== -1)  {
                    formOptions[item.name] = item.value;
                }
            });

            $.each(variants, function(index, variant) {
                if (variant.option1 === formOptions.option1 && variant.option2 === formOptions.option2 && variant.option3 === formOptions.option3) {
                    selectedVariant = variant;
                    return false;
                }
            });

            return selectedVariant;

        },
        validate: function(event, selectedVariant) {
            let
                $form = $(this),
                hasVariant = selectedVariant !== null,
                canAddToCart = hasVariant && selectedVariant.inventory_quantity > 0,
                $id = $form.find('.js-variant-id'),
                $addToCartButton = $form.find('#add-to-cart-button'),
                $price = $form.find('.js-price'),
                formattedVariantPrice,
                priceHTML;

            if (hasVariant) {
                formattedVariantPrice = '$' + (selectedVariant.price/100).toFixed(2);
                priceHTML = '<span class="money">'+formattedVariantPrice+'</span>';
                window.history.replaceState(null, null, '?variant='+selectedVariant.id);
            } else {
                priceHTML = $price.attr('data-default-price');
            }

            if(canAddToCart) {
                $id.val(selectedVariant.id);
                $addToCartButton.prop('disabled', false)

            } else {
                $id.val('');
                $addToCartButton.prop('disabled', true)
            }

            $price.html(priceHTML);
            currencyPicker.onMoneySpanAdded();
        },
        init: function() {
            $(document).on('change', productOptionSelector, productForm.onProductOptionChanged);
            $(document).on('form:change', addToCartFormSelector, productForm.validate);

        }
    };

    productForm.init();

    //Ajax API Functionality
    let miniCartContentsSelector = '.js-mini-cart-contents';
    let ajaxify = {
        onAddToCart: function(event)  {
            event.preventDefault();

            $.ajax ({
                type: 'POST',
                url: '/cart/add.js',
                data: $(this).serialize(),
                dataType: 'json',
                success: ajaxify.onCartUpdated,
                error: ajaxify.onError
            });
        },
        onCartUpdated: function() {
            let 
                $miniCartFieldset = $(miniCartContentsSelector + ' .js-cart-fieldset');

            $miniCartFieldset.prop('disabled', true);

            $.ajax({
                type: 'GET',
                url: '/cart',
                context: document.body,
                success: function(context) {
                    let
                        $dataCartContents = $(context).find('.js-cart-page-contents'),
                        dataCartHtml = $dataCartContents.html(),
                        dataCartItemCount = $dataCartContents.attr('data-cart-item-count'),
                        $miniCartContents = $(miniCartContentsSelector),
                        $cartItemCount = $('.js-cart-item-count');

                    $cartItemCount.text(dataCartItemCount);
                    $miniCartContents.html(dataCartHtml);
                    currencyPicker.onMoneySpanAdded();

                    if (parseInt(dataCartItemCount) > 0) {
                        ajaxify.openCart();
                    } 
                    else {
                        ajaxify.closeCart();
                    }
                }
            });
        },
        onError: function(XMLHttpRequest, textStatus) {
            let data = XMLHttpRequest.responseJSON;
            alert(data.status + ' - ' + data.message + ': ' + data.description);
        },
        onCartButtonClick: function(event) {
            event.preventDefault();

            let isCartOpen = $('html').hasClass('mini-cart-open');

            if (!isCartOpen) {
                ajaxify.openCart();
            }
            else {
                ajaxify.closeCart();
            }
        },
        openCart: function() {
            $('html').addClass('mini-cart-open');
        },
        closeCart: function() {
            $('html').removeClass('mini-cart-open');
        },
        init: function() {
            $(document).on('submit', addToCartFormSelector, ajaxify.onAddToCart);

            $(document).on('click', '.js-cart-link', ajaxify.onCartButtonClick);
        }
    };

    ajaxify.init();


//Quantity Fields
let
    quantityFieldSelector = '.js-quantity-field',
    quantityButtonSelector = '.js-quantity-button',
    quantityPickerSelector = '.js-quantity-picker',
    quantityPicker = {
        onButtonClick: function(event){
            //alert('Button clicked!');
            let
                $button = $(this),
                $picker = $button.closest(quantityPickerSelector),
                $quantity = $picker.find('.js-quantity-field'),
                quantityValue = parseInt($quantity.val()),
                max = $quantity.attr('max') ? parseInt($quantity.attr('max')) : null;

            if ($button.hasClass('plus') && (max === null || quantityValue+1 <= max)) {
                // do something for plus click
                $quantity.val(quantityValue + 1).change();
            }
            else if ($button.hasClass('minus')) {
                // do something gor minus click
                $quantity.val(quantityValue - 1).change();
            }
        },
        onChange: function(event){
            let 
                $field = $(this),
                $picker = $field.closest(quantityPickerSelector),
                $quantityText = $picker.find('.js-quantity-text'),
                shouldDisableMinus = parseInt(this.value) === parseInt($field.attr('min')),
                shouldDisablePlus = parseInt(this.value) === parseInt($field.attr('max')),
                $minusButton = $picker.find('js-quantity-button.minus'),
                $plusButton = $picker.find('js-quantity-button.plus');

            $quantityText.text(this.value);

            if (shouldDisableMinus) {
                $minusButton.prop('disabled', true);
            }
            else if ($minusButton.prop('disabled') === true) {
                $minusButton.prop('disabled', false);
            }

            if (shouldDisablePlus) {
                $plusButton.prop('disabled', true);
            }
            else if ($plusButton.prop('disabled') === true) {
                $plusButton.prop('disabled', false);
            }
        },
        init: function() {
            $(document).on('click', quantityButtonSelector, quantityPicker.onButtonClick);
            $(document).on('change', quantityFieldSelector, quantityPicker.onChange);
        }
    };

    quantityPicker.init();

// Line Item
let
    removeLineSelector =  '.js-remove-line',
    lineQuantitySelector = '.js-line-quantity';

let
    lineItem = {
        isInMiniCart: function(element) {
            let
                $element = $(element),
                $miniCart = $(element).closest(miniCartContentsSelector),
                isInMiniCart = $miniCart.length !== 0;

            return isInMiniCart;
        },
        onLineQuantityChanged: function(event) {
            let
                quantity = this.value,
                id = $(this).attr('id').replace('updates_', ''),
                changes = {
                    quantity: quantity,
                    id: id
                },
                isInMiniCart = lineItem.isInMiniCart(this);
            
            if (isInMiniCart) {
                $.post('/cart/change.js', changes, ajaxify.onCartUpdated, 'json');
            }
        },
        onLineRemoved: function(event) {
            let isInMiniCart = lineItem.isInMiniCart(this);

            if (isInMiniCart) {
                event.preventDefault();

                let
                    $removeLink = $(this),
                    removeQuery = $removeLink.attr('href').split('change?')[1];
                $.post('/cart/change.js', removeQuery, ajaxify.onCartUpdated, 'json');
            }
        },
        init: function() {
            $(document).on('click', removeLineSelector, lineItem.onLineRemoved);
            $(document).on('change', lineQuantitySelector, lineItem.onLineQuantityChanged);

        }
    };

lineItem.init();

});
