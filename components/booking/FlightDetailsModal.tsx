import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Share,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { Flight } from '@/types';
import { mediaService } from '@/services/media/mediaService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

interface FlightDetailsModalProps {
  visible: boolean;
  flight: Flight | null;
  onClose: () => void;
  onBook: (flight: Flight) => void;
  onTrackPrice: (flight: Flight) => void;
  onShare: (flight: Flight) => void;
}

export const FlightDetailsModal: React.FC<FlightDetailsModalProps> = ({
  visible,
  flight,
  onClose,
  onBook,
  onTrackPrice,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'amenities' | 'policies'>('details');
  const translateY = useSharedValue(MODAL_HEIGHT);
  const opacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Animation values for content sections
  const headerOpacity = useSharedValue(0);
  const tabsOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);

  useEffect(() => {
    if (visible && flight) {
      // Animate modal in
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withSpring(1);
      
      // Staggered content animation
      headerOpacity.value = withDelay(200, withSpring(1));
      tabsOpacity.value = withDelay(400, withSpring(1));
      contentOpacity.value = withDelay(600, withSpring(1));
      contentScale.value = withDelay(600, withSpring(1));
    } else {
      // Animate modal out
      translateY.value = withSpring(MODAL_HEIGHT);
      opacity.value = withSpring(0);
      headerOpacity.value = withSpring(0);
      tabsOpacity.value = withSpring(0);
      contentOpacity.value = withSpring(0);
      contentScale.value = withSpring(0.95);
    }
  }, [visible, flight]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleBook = () => {
    if (flight) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onBook(flight);
    }
  };

  const handleTrackPrice = () => {
    if (flight) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTrackPrice(flight);
    }
  };

  const handleShare = async () => {
    if (!flight) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const message = `Check out this flight deal! ${flight.segments[0].departure.airport.code} → ${flight.segments[flight.segments.length - 1].arrival.airport.code} for $${flight.price.total} on ${flight.segments[0].airline.name}`;
      
      await Share.share({
        message,
        title: 'Flight Deal',
      });
      onShare(flight);
    } catch (error) {
      console.error('Error sharing flight:', error);
    }
  };

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const tabsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabsOpacity.value,
  }));

  const contentSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  // Format helpers
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!flight) return null;

  const departureSegment = flight.segments[0];
  const arrivalSegment = flight.segments[flight.segments.length - 1];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.container}>
        <Animated.View style={[styles.backdrop, modalAnimatedStyle]}>
          <Pressable style={styles.backdropTouchable} onPress={handleClose} />
          
          <Animated.View style={[styles.modalContent, contentAnimatedStyle]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
              <View style={styles.headerLeft}>
                <Image
                  source={{ uri: mediaService.getAirlineLogo(departureSegment.airline.code) }}
                  style={styles.airlineLogo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
                <View>
                  <Text style={styles.airlineName}>{departureSegment.airline.name}</Text>
                  <Text style={styles.flightNumber}>
                    {departureSegment.flightNumber} • {departureSegment.aircraft.model}
                  </Text>
                </View>
              </View>
              
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                  <IconSymbol name="square.and.arrow.up" size={20} color={DesignSystem.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={20} color={DesignSystem.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Route Overview */}
            <Animated.View style={[styles.routeOverview, headerAnimatedStyle]}>
              <View style={styles.routeInfo}>
                <View style={styles.routePoint}>
                  <Text style={styles.airportCode}>{departureSegment.departure.airport.code}</Text>
                  <Text style={styles.cityName}>{departureSegment.departure.airport.city}</Text>
                  <Text style={styles.timeText}>{formatTime(departureSegment.departure.time)}</Text>
                  <Text style={styles.dateText}>{formatDate(departureSegment.departure.time)}</Text>
                </View>

                <View style={styles.routeLine}>
                  <View style={styles.routePath} />
                  <IconSymbol name="airplane" size={16} color={DesignSystem.colors.primary} style={styles.airplaneIcon} />
                  <Text style={styles.durationText}>{formatDuration(flight.totalDuration)}</Text>
                  {flight.stops > 0 && (
                    <Text style={styles.stopsText}>{flight.stops} stop{flight.stops > 1 ? 's' : ''}</Text>
                  )}
                </View>

                <View style={styles.routePoint}>
                  <Text style={styles.airportCode}>{arrivalSegment.arrival.airport.code}</Text>
                  <Text style={styles.cityName}>{arrivalSegment.arrival.airport.city}</Text>
                  <Text style={styles.timeText}>{formatTime(arrivalSegment.arrival.time)}</Text>
                  <Text style={styles.dateText}>{formatDate(arrivalSegment.arrival.time)}</Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceSection}>
                {flight.deals && (
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealText}>{flight.deals.discount}% OFF</Text>
                  </View>
                )}
                <View style={styles.priceContainer}>
                  {flight.deals && (
                    <Text style={styles.originalPrice}>${flight.deals.originalPrice}</Text>
                  )}
                  <Text style={styles.price}>${flight.price.total}</Text>
                  <Text style={styles.perPerson}>per person</Text>
                </View>
              </View>
            </Animated.View>

            {/* Tabs */}
            <Animated.View style={[styles.tabs, tabsAnimatedStyle]}>
              {(['details', 'amenities', 'policies'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Content */}
            <Animated.View style={[styles.content, contentSectionAnimatedStyle]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {activeTab === 'details' && (
                  <View style={styles.tabContent}>
                    {/* Flight Segments */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Flight Details</Text>
                      {flight.segments.map((segment, index) => (
                        <View key={segment.id} style={styles.segmentCard}>
                          <View style={styles.segmentHeader}>
                            <Text style={styles.segmentTitle}>
                              {index === 0 ? 'Outbound' : `Segment ${index + 1}`}
                            </Text>
                            <Text style={styles.segmentFlight}>
                              {segment.airline.code} {segment.flightNumber}
                            </Text>
                          </View>
                          
                          <View style={styles.segmentRoute}>
                            <View style={styles.segmentPoint}>
                              <Text style={styles.segmentTime}>{formatTime(segment.departure.time)}</Text>
                              <Text style={styles.segmentAirport}>{segment.departure.airport.code}</Text>
                              {segment.departure.terminal && (
                                <Text style={styles.segmentTerminal}>Terminal {segment.departure.terminal}</Text>
                              )}
                            </View>
                            
                            <View style={styles.segmentDuration}>
                              <Text style={styles.segmentDurationText}>{formatDuration(segment.duration)}</Text>
                            </View>
                            
                            <View style={styles.segmentPoint}>
                              <Text style={styles.segmentTime}>{formatTime(segment.arrival.time)}</Text>
                              <Text style={styles.segmentAirport}>{segment.arrival.airport.code}</Text>
                              {segment.arrival.terminal && (
                                <Text style={styles.segmentTerminal}>Terminal {segment.arrival.terminal}</Text>
                              )}
                            </View>
                          </View>
                          
                          <Text style={styles.aircraftInfo}>
                            {segment.aircraft.manufacturer} {segment.aircraft.model}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Price Breakdown */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Price Breakdown</Text>
                      <View style={styles.priceBreakdown}>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Base Fare</Text>
                          <Text style={styles.priceValue}>${flight.price.breakdown.base}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Taxes & Fees</Text>
                          <Text style={styles.priceValue}>${flight.price.breakdown.taxes + flight.price.breakdown.fees}</Text>
                        </View>
                        <View style={[styles.priceRow, styles.totalRow]}>
                          <Text style={styles.totalLabel}>Total</Text>
                          <Text style={styles.totalValue}>${flight.price.total}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {activeTab === 'amenities' && (
                  <View style={styles.tabContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Included Amenities</Text>
                      <View style={styles.amenitiesGrid}>
                        {flight.amenities.map((amenity, index) => (
                          <View key={index} style={styles.amenityItem}>
                            <IconSymbol name="checkmark.circle.fill" size={16} color={DesignSystem.colors.success} />
                            <Text style={styles.amenityText}>{amenity}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Baggage</Text>
                      <View style={styles.baggageInfo}>
                        <View style={styles.baggageItem}>
                          <IconSymbol name="bag" size={20} color={DesignSystem.colors.textSecondary} />
                          <View style={styles.baggageDetails}>
                            <Text style={styles.baggageTitle}>Carry-on</Text>
                            <Text style={styles.baggageDesc}>
                              {flight.baggage.carry_on.included ? 'Included' : 'Not included'}
                              {flight.baggage.carry_on.dimensions && ` • ${flight.baggage.carry_on.dimensions}`}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.baggageItem}>
                          <IconSymbol name="suitcase" size={20} color={DesignSystem.colors.textSecondary} />
                          <View style={styles.baggageDetails}>
                            <Text style={styles.baggageTitle}>Checked Bag</Text>
                            <Text style={styles.baggageDesc}>
                              {flight.baggage.checked.included 
                                ? 'Included' 
                                : `$${flight.baggage.checked.fee} fee`}
                              {flight.baggage.checked.weight && ` • Up to ${flight.baggage.checked.weight}kg`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {activeTab === 'policies' && (
                  <View style={styles.tabContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Booking Policies</Text>
                      
                      <View style={styles.policyItem}>
                        <View style={styles.policyHeader}>
                          <IconSymbol 
                            name={flight.changeable ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                            size={16} 
                            color={flight.changeable ? DesignSystem.colors.success : DesignSystem.colors.error} 
                          />
                          <Text style={styles.policyTitle}>Changes</Text>
                        </View>
                        <Text style={styles.policyText}>
                          {flight.changeable 
                            ? "Flight changes allowed with applicable fees" 
                            : "No changes allowed after booking"}
                        </Text>
                      </View>

                      <View style={styles.policyItem}>
                        <View style={styles.policyHeader}>
                          <IconSymbol 
                            name={flight.refundable ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                            size={16} 
                            color={flight.refundable ? DesignSystem.colors.success : DesignSystem.colors.error} 
                          />
                          <Text style={styles.policyTitle}>Refunds</Text>
                        </View>
                        <Text style={styles.policyText}>
                          {flight.refundable 
                            ? "Refundable with cancellation fees" 
                            : "Non-refundable ticket"}
                        </Text>
                      </View>

                      <View style={styles.policyItem}>
                        <View style={styles.policyHeader}>
                          <IconSymbol name="info.circle" size={16} color={DesignSystem.colors.primary} />
                          <Text style={styles.policyTitle}>Booking Class</Text>
                        </View>
                        <Text style={styles.policyText}>
                          {flight.cabin.charAt(0).toUpperCase() + flight.cabin.slice(1).replace('_', ' ')} • Class {flight.bookingClass}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Availability</Text>
                      <View style={styles.availabilityInfo}>
                        <Text style={styles.availabilityText}>
                          {flight.availability.seatsLeft} seats remaining
                        </Text>
                        <Text style={styles.lastUpdated}>
                          Last updated: {flight.availability.lastUpdated.toLocaleTimeString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </Animated.View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={handleTrackPrice}
                activeOpacity={0.8}
              >
                <IconSymbol name="bell" size={18} color={DesignSystem.colors.primary} />
                <Text style={styles.trackButtonText}>Track Price</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBook}
                activeOpacity={0.8}
              >
                <Text style={styles.bookButtonText}>Book Flight</Text>
                <IconSymbol name="arrow.right" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    height: MODAL_HEIGHT,
    backgroundColor: DesignSystem.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: DesignSystem.colors.inactive,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  airlineLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 12,
  },
  airlineName: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  flightNumber: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  routeOverview: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    alignItems: 'center',
    minWidth: 80,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
  },
  cityName: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
    position: 'relative',
  },
  routePath: {
    height: 2,
    backgroundColor: DesignSystem.colors.border,
    width: '100%',
  },
  airplaneIcon: {
    position: 'absolute',
    top: -7,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8,
    padding: 2,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginTop: 12,
  },
  stopsText: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  priceSection: {
    alignItems: 'center',
  },
  dealBadge: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  dealText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: DesignSystem.colors.textPrimary,
  },
  perPerson: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: DesignSystem.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tabContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
    marginBottom: 16,
  },
  segmentCard: {
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  segmentFlight: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  segmentRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  segmentPoint: {
    alignItems: 'center',
    minWidth: 60,
  },
  segmentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  segmentAirport: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  segmentTerminal: {
    fontSize: 10,
    color: DesignSystem.colors.textSecondary,
    marginTop: 2,
  },
  segmentDuration: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  segmentDurationText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
  },
  aircraftInfo: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },
  priceBreakdown: {
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: DesignSystem.colors.textPrimary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignSystem.colors.textPrimary,
  },
  amenitiesGrid: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amenityText: {
    fontSize: 16,
    color: DesignSystem.colors.textPrimary,
  },
  baggageInfo: {
    gap: 16,
  },
  baggageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignSystem.colors.background,
    padding: 16,
    borderRadius: 12,
  },
  baggageDetails: {
    flex: 1,
  },
  baggageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  baggageDesc: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    marginTop: 4,
  },
  policyItem: {
    marginBottom: 16,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  policyText: {
    fontSize: 14,
    color: DesignSystem.colors.textSecondary,
    lineHeight: 20,
  },
  availabilityInfo: {
    backgroundColor: DesignSystem.colors.background,
    padding: 16,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.textPrimary,
  },
  lastUpdated: {
    fontSize: 12,
    color: DesignSystem.colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border,
    gap: 12,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    flex: 2,
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});