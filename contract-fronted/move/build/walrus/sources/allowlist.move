// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Based on the allowlist pattern

module walrus::allowlist;

use std::string::String;
use sui::dynamic_field as df;
use walrus::utils::is_prefix;

const EInvalidCap: u64 = 0;
const ENoAccess: u64 = 1;
const EDuplicate: u64 = 2;
const MARKER: u64 = 3;

public struct Allowlist has key {
    id: UID,
    name: String,
    list: vector<address>,
    is_private: bool,
    contract_type: String, // "public", "private_two_party", "private_multi_party"
    encryption_key_id: String, // For private contracts
    contract_summary: String, // Summary of the contract
    contract_details: String, // Detailed contract information (parties, payments, etc.)
}

public struct Cap has key {
    id: UID,
    allowlist_id: ID,
}

//////////////////////////////////////////
/////// Simple allowlist with an admin cap

/// Create an allowlist with an admin cap.
/// The associated key-ids are [pkg id]::[allowlist id][nonce] for any nonce (thus
/// many key-ids can be created for the same allowlist).
public fun create_allowlist(
    name: String, 
    contract_summary: String, 
    contract_details: String, 
    ctx: &mut TxContext
): Cap {
    let allowlist = Allowlist {
        id: object::new(ctx),
        list: vector::empty(),
        name: name,
        is_private: false,
        contract_type: b"public".to_string(),
        encryption_key_id: b"".to_string(),
        contract_summary: contract_summary,
        contract_details: contract_details,
    };
    let cap = Cap {
        id: object::new(ctx),
        allowlist_id: object::id(&allowlist),
    };
    transfer::share_object(allowlist);
    cap
}

/// Create a private two-party contract
public fun create_private_contract(
    name: String, 
    party1: address, 
    party2: address, 
    encryption_key_id: String,
    contract_summary: String,
    contract_details: String,
    ctx: &mut TxContext
): Cap {
    let allowlist = Allowlist {
        id: object::new(ctx),
        list: vector[party1, party2],
        name: name,
        is_private: true,
        contract_type: b"private_two_party".to_string(),
        encryption_key_id: encryption_key_id,
        contract_summary: contract_summary,
        contract_details: contract_details,
    };
    let cap = Cap {
        id: object::new(ctx),
        allowlist_id: object::id(&allowlist),
    };
    transfer::share_object(allowlist);
    cap
}

// convenience function to create a allowlist and send it back to sender (simpler ptb for cli)
entry fun create_allowlist_entry(
    name: String, 
    contract_summary: String, 
    contract_details: String, 
    ctx: &mut TxContext
) {
    transfer::transfer(create_allowlist(name, contract_summary, contract_details, ctx), ctx.sender());
}

// convenience function to create a private contract and send it back to sender
entry fun create_private_contract_entry(
    name: String, 
    party2: address, 
    encryption_key_id: String,
    contract_summary: String,
    contract_details: String,
    ctx: &mut TxContext
) {
    transfer::transfer(
        create_private_contract(name, ctx.sender(), party2, encryption_key_id, contract_summary, contract_details, ctx), 
        ctx.sender()
    );
}

public fun add(allowlist: &mut Allowlist, cap: &Cap, account: address) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    // For private contracts, only allow modifications if it's not a two-party contract
    if (allowlist.is_private && allowlist.contract_type == b"private_two_party".to_string()) {
        abort ENoAccess // Cannot modify two-party private contracts
    };
    assert!(!allowlist.list.contains(&account), EDuplicate);
    allowlist.list.push_back(account);
}

public fun remove(allowlist: &mut Allowlist, cap: &Cap, account: address) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    // For private contracts, only allow modifications if it's not a two-party contract
    if (allowlist.is_private && allowlist.contract_type == b"private_two_party".to_string()) {
        abort ENoAccess // Cannot modify two-party private contracts
    };
    allowlist.list = allowlist.list.filter!(|x| x != account); // TODO: more efficient impl?
}

//////////////////////////////////////////////////////////
/// Access control
/// key format: [pkg id]::[allowlist id][random nonce]
/// (Alternative key format: [pkg id]::[creator address][random nonce] - see private_data.move)

public fun namespace(allowlist: &Allowlist): vector<u8> {
    allowlist.id.to_bytes()
}

/// All allowlisted addresses can access all IDs with the prefix of the allowlist
fun approve_internal(caller: address, id: vector<u8>, allowlist: &Allowlist): bool {
    // Check if the id has the right prefix
    let namespace = namespace(allowlist);
    if (!is_prefix(namespace, id)) {
        return false
    };

    // Check if user is in the allowlist
    allowlist.list.contains(&caller)
}

entry fun seal_approve(id: vector<u8>, allowlist: &Allowlist, ctx: &TxContext) {
    assert!(approve_internal(ctx.sender(), id, allowlist), ENoAccess);
}

/// Encapsulate a blob into a Sui object and attach it to the allowlist
public fun publish(allowlist: &mut Allowlist, cap: &Cap, blob_id: String) {
    assert!(cap.allowlist_id == object::id(allowlist), EInvalidCap);
    df::add(&mut allowlist.id, blob_id, MARKER);
}

/// Get contract information for searching
public fun get_contract_info(allowlist: &Allowlist): (String, bool, String, vector<address>, String, String) {
    (allowlist.name, allowlist.is_private, allowlist.contract_type, allowlist.list, allowlist.contract_summary, allowlist.contract_details)
}

#[test_only]
public fun new_allowlist_for_testing(ctx: &mut TxContext): Allowlist {

    Allowlist {
        id: object::new(ctx),
        name: b"test".to_string(),
        list: vector::empty(),
        is_private: false,
        contract_type: b"public".to_string(),
        encryption_key_id: b"".to_string(),
        contract_summary: b"Test contract summary".to_string(),
        contract_details: b"Test contract details".to_string(),
    }
}

#[test_only]
public fun new_cap_for_testing(ctx: &mut TxContext, allowlist: &Allowlist): Cap {
    Cap {
        id: object::new(ctx),
        allowlist_id: object::id(allowlist),
    }
}

#[test_only]
public fun destroy_for_testing(allowlist: Allowlist, cap: Cap) {
    let Allowlist { id, .. } = allowlist;
    object::delete(id);
    let Cap { id, .. } = cap;
    object::delete(id);
}
