import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Searchbar, FAB } from 'react-native-paper';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { ROLES, hasRole } from '../utils/roles';

const MembersScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const isAdmin = hasRole(user, [ROLES.ADMIN]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMembers({ search: searchQuery });
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const MemberCard = ({ member }) => (
    <Card
      style={styles.memberCard}
      onPress={isAdmin ? () => navigation.navigate('AddMember', { member }) : undefined}
    >
      <Card.Content>
        <View style={styles.memberHeader}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberPhone}>{member.phone}</Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: member.status === 'active' ? '#10b981' : '#ef4444' 
          }]}>
            <Text style={styles.statusText}>{member.status}</Text>
          </View>
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberDetail}>
            Plan: {member.membership?.[0]?.planType || 'N/A'}
          </Text>
          <Text style={styles.memberDetail}>
            Expires: {new Date(member.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Members</Text>
        <Searchbar
          placeholder="Search members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={fetchMembers}
          style={styles.searchBar}
        />
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemberCard member={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMembers} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {isAdmin && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddMember')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
  },
  listContainer: {
    padding: 20,
  },
  memberCard: {
    marginBottom: 12,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  memberPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6',
  },
});

export default MembersScreen;
