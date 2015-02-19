/* jshint
 funcscope: true,
 newcap: true,
 nonew: true,
 shadow: false,
 unused: true,

 maxlen: 90,
 maxparams: 3,
 maxstatements: 200
 */
/* global $ */
'use strict';

var markup = require('./NetSimSendWidget.html');
var dom = require('../dom');
var PacketEncoder = require('./PacketEncoder');
var KeyCodes = require('../constants').KeyCodes;

function unsignedIntegerToBinaryString(integer, size) {
  var binary = integer.toString(2);
  while (binary.length < size) {
    binary = '0' + binary;
  }
  // TODO: Deal with overflow?
  return binary;
}

function asciiToBinaryString(ascii) {
  var result = '';
  for (var i = 0; i < ascii.length; i++) {
    result += unsignedIntegerToBinaryString(ascii.charCodeAt(i), 8);
  }
  return result;
}

function formatToChunkSize(rawBinary, chunkSize) {
  var result = '';
  for (var i = 0; i < rawBinary.length; i += chunkSize) {
    if (result.length > 0) {
      result += ' ';
    }
    result += rawBinary.slice(i, i+chunkSize);
  }
  return result;
}

/**
 * Generator and controller for message sending view.
 * @param {NetSimConnection} connection
 * @constructor
 */
var NetSimSendWidget = module.exports = function (connection) {
  /**
   * Connection that owns the router we will represent / manipulate
   * @type {NetSimConnection}
   * @private
   */
  this.connection_ = connection;
  this.connection_.statusChanges
      .register(this.onConnectionStatusChange_.bind(this));

  this.packetBinary = '';
  this.toAddress_ = 0;
  this.fromAddress_ = 0;
};

/**
 * Generate a new NetSimSendWidget, puttig it on the page and hooking
 * it up to the given connection where it will update to reflect the
 * state of the connected router, if there is one.
 * @param element
 * @param connection
 */
NetSimSendWidget.createWithin = function (element, connection) {
  var controller = new NetSimSendWidget(connection);
  element.innerHTML = markup({});
  controller.bindElements_();
  controller.refresh();
  return controller;
};

/**
 * Creates a keyPress handler that allows only the given characters to be
 * typed into a text field.
 * @param {RegExp} whitelistRegex
 * @return {function} appropriate to pass to .keypress()
 */
var whitelistCharacters = function (whitelistRegex) {
  /**
   * A keyPress handler that blocks all visible characters except those
   * matching the whitelist.  Passes through invisible characters (backspace,
   * delete) and control combinations (copy, paste).
   *
   * @param keyEvent
   * @returns {boolean} - Whether to propagate this event.  Should return
   *          FALSE if we handle the event and don't want to pass it on, TRUE
   *          if we are not handling the event.
   */
  var keyPressHandler = function (keyEvent) {

    // Don't block control combinations (copy, paste, etc.)
    if (keyEvent.metaKey || keyEvent.ctrlKey) {
      return true;
    }

    // Don't block invisible characters; we want to allow backspace, delete, etc.
    if (keyEvent.which < KeyCodes.SPACE || keyEvent.which >= KeyCodes.DELETE) {
      return true;
    }

    // At this point, if the character doesn't match, we should block it.
    var key = String.fromCharCode(keyEvent.which);
    if (!whitelistRegex.test(key)) {
      keyEvent.preventDefault();
      return false;
    }
  };
  return keyPressHandler;
};

/**
 * Get relevant elements from the page and bind them to local variables.
 * @private
 */
NetSimSendWidget.prototype.bindElements_ = function () {
  this.rootDiv_ = $('#netsim_send_widget');
  this.toAddressTextbox_ = this.rootDiv_.find('#to_address');
  this.toAddressTextbox_.keypress(whitelistCharacters(/[0-9]/));
  this.toAddressTextbox_.change(this.onToAddressChange_.bind(this));

  this.fromAddressTextbox_ = this.rootDiv_.find('#from_address');

  this.binaryPayloadTextbox_ = this.rootDiv_.find('#binary_payload');
  this.binaryPayloadTextbox_.keypress(whitelistCharacters(/[01]/));
  this.binaryPayloadTextbox_.keyup(this.onBinaryPayloadChange_.bind(this));
  this.binaryPayloadTextbox_.change(this.onBinaryPayloadChange_.bind(this));

  this.asciiPayloadTextbox_ = this.rootDiv_.find('#ascii_payload');
  this.asciiPayloadTextbox_.keyup(this.onAsciiPayloadChange_.bind(this));
  this.asciiPayloadTextbox_.change(this.onAsciiPayloadChange_.bind(this));

  this.bitCounter_ = this.rootDiv_.find('#bit_counter');

  this.sendButton_ = this.rootDiv_.find('#send_button');

  dom.addClickTouchEvent(this.sendButton_[0], this.onSendButtonPress_.bind(this));
};

// TODO (bbuchanan) : This should live somewhere common across the client.
var packetEncoder = new PacketEncoder([
  { key: 'toAddress', bits: 4 },
  { key: 'fromAddress', bits: 4 },
  { key: 'payload', bits: Infinity }
]);

/**
 * Handler for connection status changes.  Can update configuration and
 * trigger a refresh of this view.
 * @private
 */
NetSimSendWidget.prototype.onConnectionStatusChange_ = function () {
  if (this.connection_.myNode && this.connection_.myNode.myWire) {
    this.fromAddress_ = this.connection_.myNode.myWire.localAddress;
  } else {
    this.fromAddress_ = 0;
  }

  this.rebuildPacketBinary_();
  this.refresh();
};

NetSimSendWidget.prototype.onToAddressChange_ = function () {
  this.toAddress_ = parseInt(this.toAddressTextbox_.val(), 10);
  this.rebuildPacketBinary_();
  this.refresh();
};

NetSimSendWidget.prototype.onBinaryPayloadChange_ = function () {
  this.rebuildPacketBinary_();
  this.refresh();
};

NetSimSendWidget.prototype.onAsciiPayloadChange_ = function () {
  this.binaryPayloadTextbox_.val(asciiToBinaryString(this.asciiPayloadTextbox_.val()));
  this.rebuildPacketBinary_();
  this.refresh();
};

NetSimSendWidget.prototype.rebuildPacketBinary_ = function () {
  this.packetBinary = packetEncoder.createBinary({
    toAddress: unsignedIntegerToBinaryString(this.toAddress_, 4),
    fromAddress: unsignedIntegerToBinaryString(this.fromAddress_, 4),
    payload: this.binaryPayloadTextbox_.val().replace(/[^01]/g, '')
  });
};

/** Update send widget display */
NetSimSendWidget.prototype.refresh = function () {
  // Non-interactive right now
  this.rootDiv_.find('#packet_index').val(1);
  this.rootDiv_.find('#packet_count').val(1);

  this.toAddressTextbox_.val(this.toAddress_);

  this.fromAddressTextbox_.val(this.fromAddress_);

  this.bitCounter_.html(this.packetBinary.length + '/Infinity bits');

  var binaryPayload = packetEncoder.getField('payload', this.packetBinary);
  this.binaryPayloadTextbox_.val(formatToChunkSize(binaryPayload, 8));

  var asciiPayload = packetEncoder.getFieldAsAscii('payload', this.packetBinary);
  this.asciiPayloadTextbox_.val(asciiPayload);
};

/** Send message to connected remote */
NetSimSendWidget.prototype.onSendButtonPress_ = function () {
  var myNode = this.connection_.myNode;
  if (!myNode) {
    return;
  }

  myNode.sendMessage(this.packetBinary);
};
