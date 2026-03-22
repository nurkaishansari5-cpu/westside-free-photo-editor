import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

actor {
  let userPreferences = Map.empty<Principal, Preference>();

  type Filters = {
    sepia : Bool;
    blackAndWhite : Bool;
    blur : Bool;
    grayscale : Bool;
    invert : Bool;
  };

  type Preference = {
    filters : Filters;
    defaultResolution : (Nat, Nat);
  };

  module Preference {
    func compareResolutions(a : (Nat, Nat), b : (Nat, Nat)) : Order.Order {
      if (a.0 < b.0) {
        #less;
      } else if (a.0 > b.0) {
        #greater;
      } else if (a.1 < b.1) {
        #less;
      } else if (a.1 > b.1) {
        #greater;
      } else {
        #equal;
      };
    };

    public func compare(a : Preference, b : Preference) : Order.Order {
      compareResolutions(a.defaultResolution, b.defaultResolution);
    };
  };

  public shared ({ caller }) func setUserPreference(preference : Preference) : async () {
    userPreferences.add(caller, preference);
  };

  public query ({ caller }) func getUserPreference() : async Preference {
    switch (userPreferences.get(caller)) {
      case (null) { Runtime.trap("No preferences found") };
      case (?preferences) { preferences };
    };
  };

  public query ({ caller }) func getAllPreferences() : async [Preference] {
    userPreferences.values().toArray().sort();
  };

  public query ({ caller }) func getDefaultPreferences() : async Preference {
    {
      filters = {
        sepia = false;
        blackAndWhite = false;
        blur = false;
        grayscale = false;
        invert = false;
      };
      defaultResolution = (1920, 1080);
    };
  };
};
