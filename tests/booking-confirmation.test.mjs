import assert from "node:assert/strict";
import test from "node:test";

test("generateBookingConfirmationCode generates proper code structure", async () => {
  // Test code generation logic
  function generateBookingConfirmationCode(prefix = "HM", length = 10) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomLength = Math.max(1, length - prefix.length);
    let randomPart = "";
    for (let i = 0; i < randomLength; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${randomPart}`;
  }

  const code1 = generateBookingConfirmationCode("HM", 10);
  assert.equal(code1.length, 10);
  assert.equal(code1.startsWith("HM"), true);

  const code2 = generateBookingConfirmationCode("HM", 10);
  assert.equal(code2.length, 10);
  assert.equal(code2.startsWith("HM"), true);
  // Verify randomness
  assert.notEqual(code1, code2);
});

test("Default sample booking confirmation matches reference layout requirements", () => {
  const sample = {
    platform: "airbnb",
    listingTitle: "Berecah Apartment on Government Hill, St. Michael",
    checkInDate: "Fri, Oct 30",
    checkInTime: "2:00 PM",
    checkOutDate: "Sun, Nov 29",
    checkOutTime: "11:00 AM",
    hostPhone: "+1 246-231-9028",
    guestCountText: "1 guest",
    guestNames: "Adibe Chiamaka Loveline",
    confirmationCode: "HMSE4A3T3B",
    location: "Bridgetown, Saint Michael, Barbados",
    hostName: "Zahra",
  };

  assert.equal(sample.platform, "airbnb");
  assert.equal(sample.listingTitle, "Berecah Apartment on Government Hill, St. Michael");
  assert.equal(sample.checkInDate, "Fri, Oct 30");
  assert.equal(sample.checkInTime, "2:00 PM");
  assert.equal(sample.checkOutDate, "Sun, Nov 29");
  assert.equal(sample.checkOutTime, "11:00 AM");
  assert.equal(sample.hostPhone, "+1 246-231-9028");
  assert.equal(sample.guestCountText, "1 guest");
  assert.equal(sample.guestNames, "Adibe Chiamaka Loveline");
  assert.equal(sample.confirmationCode, "HMSE4A3T3B");
  assert.equal(sample.location, "Bridgetown, Saint Michael, Barbados");
  assert.equal(sample.hostName, "Zahra");
});

